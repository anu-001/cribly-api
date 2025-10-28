#!/bin/bash
set -e

# ==============================
# CONFIGURATION (edit as needed)
# ==============================
AWS_REGION="ca-central-1"
KEY_PAIR_NAME="nestjs-keypair"
VPC_NAME="nestjs-vpc"
EC2_NAME="nestjs-server"
RDS_NAME="nestjs-db"
REDIS_NAME="nestjs-redis"
DB_USERNAME="postgres"
DB_PASSWORD="ChangeThisStrongPass123!" # <-- IMPORTANT: CHANGE THIS!
AMI_ID="ami-007855ac798b5175e"        # Ubuntu 22.04 LTS (for ca-central-1)
INSTANCE_TYPE="t3.micro"
REDIS_NODE_TYPE="cache.t3.micro"
DB_INSTANCE_CLASS="db.t3.micro"

echo "🚀 Starting AWS NestJS Infrastructure Deployment in region: $AWS_REGION"

# Set AWS region for this script's execution
export AWS_REGION=$AWS_REGION

# ==============================
# 1. Create VPC, Subnet, and Internet Gateway
# ==============================
echo "🔧 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=$VPC_NAME

echo "🔧 Creating Internet Gateway and attaching to VPC..."
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

echo "🔧 Creating Public Subnet..."
SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --query 'Subnet.SubnetId' --output text)
aws ec2 modify-subnet-attribute --subnet-id $SUBNET_ID --map-public-ip-on-launch

echo "🔧 Creating Route Table to enable internet access..."
RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 associate-route-table --route-table-id $RT_ID --subnet-id $SUBNET_ID
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# ==============================
# 2. Create Security Groups
# ==============================
echo "🔒 Creating Security Groups..."
EC2_SG=$(aws ec2 create-security-group --group-name nestjs-ec2-sg --description "SG for NestJS EC2" --vpc-id $VPC_ID --query 'GroupId' --output text)
RDS_SG=$(aws ec2 create-security-group --group-name nestjs-rds-sg --description "SG for NestJS RDS" --vpc-id $VPC_ID --query 'GroupId' --output text)
REDIS_SG=$(aws ec2 create-security-group --group-name nestjs-redis-sg --description "SG for NestJS Redis" --vpc-id $VPC_ID --query 'GroupId' --output text)

echo "🔑 Setting firewall rules for Security Groups..."
MY_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 22 --cidr ${MY_IP}/32 # Allow SSH from your current IP
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 80 --cidr 0.0.0.0/0  # Allow HTTP traffic from anywhere
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $EC2_SG # Allow PostgreSQL traffic only from the EC2 instance
aws ec2 authorize-security-group-ingress --group-id $REDIS_SG --protocol tcp --port 6379 --source-group $EC2_SG # Allow Redis traffic only from the EC2 instance

# ==============================
# 3. Create SSH Key Pair
# ==============================
echo "🔑 Creating SSH key pair and saving to ~/.ssh/${KEY_PAIR_NAME}.pem"
# Create directory in your HOME directory if it doesn't exist
mkdir -p ~/.ssh
# Create key and save it securely to your HOME directory
aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --query 'KeyMaterial' --output text > ~/.ssh/${KEY_PAIR_NAME}.pem
# Set correct, restrictive permissions
chmod 400 ~/.ssh/${KEY_PAIR_NAME}.pem

# ==============================
# 4. Launch EC2 Instance
# ==============================
echo "💻 Launching EC2 instance..."
EC2_ID=$(aws ec2 run-instances --image-id $AMI_ID --instance-type $INSTANCE_TYPE --key-name $KEY_PAIR_NAME --security-group-ids $EC2_SG --subnet-id $SUBNET_ID --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$EC2_NAME}]" --query 'Instances[0].InstanceId' --output text)

echo "⏳ Waiting for EC2 instance to be running..."
aws ec2 wait instance-running --instance-ids $EC2_ID
EC2_PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $EC2_ID --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
echo "✅ EC2 Instance is running at IP: $EC2_PUBLIC_IP"

# ==========================================================
# 5. Create RDS PostgreSQL (with required DB Subnet Group)
# ==========================================================
echo "🔧 Creating RDS DB Subnet Group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name nestjs-db-subnet-group \
  --db-subnet-group-description "Subnet group for NestJS RDS" \
  --subnet-ids $SUBNET_ID > /dev/null

echo "🐘 Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
  --db-instance-identifier $RDS_NAME \
  --db-instance-class $DB_INSTANCE_CLASS \
  --allocated-storage 20 \
  --engine postgres \
  --master-username $DB_USERNAME \
  --master-user-password $DB_PASSWORD \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name nestjs-db-subnet-group \
  --no-publicly-accessible

echo "⏳ Waiting for RDS to be available (this may take 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier $RDS_NAME
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $RDS_NAME --query "DBInstances[0].Endpoint.Address" --output text)
echo "✅ RDS Endpoint: $RDS_ENDPOINT"

# ===========================================================
# 6. Create ElastiCache Redis (with required Cache Subnet Group)
# ===========================================================
echo "🔧 Creating ElastiCache Subnet Group..."
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name nestjs-cache-subnet-group \
  --cache-subnet-group-description "Subnet group for NestJS Redis" \
  --subnet-ids $SUBNET_ID > /dev/null

echo "🌶️ Creating ElastiCache Redis cluster..."
aws elasticache create-cache-cluster \
  --cache-cluster-id $REDIS_NAME \
  --engine redis \
  --cache-node-type $REDIS_NODE_TYPE \
  --num-cache-nodes 1 \
  --security-group-ids $REDIS_SG \
  --cache-subnet-group-name nestjs-cache-subnet-group

echo "⏳ Waiting for Redis to be available (2-3 minutes)..."
aws elasticache wait cache-cluster-available --cache-cluster-id $REDIS_NAME
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters --cache-cluster-id $REDIS_NAME --show-cache-node-info --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text)
echo "✅ Redis Endpoint: $REDIS_ENDPOINT"

# ==============================
# 7. Display Deployment Summary
# ==============================
echo ""
echo "🎉 Deployment Complete! 🎉"
echo "----------------------------------------------------------------------------------"
echo "EC2 Public IP:      $EC2_PUBLIC_IP"
echo "RDS Endpoint:       $RDS_ENDPOINT"
echo "Redis Endpoint:     $REDIS_ENDPOINT"
echo "SSH Key Location:   ~/.ssh/${KEY_PAIR_NAME}.pem"
echo "----------------------------------------------------------------------------------"
echo "Next steps:"
echo "1. Connect via SSH: ssh -i ~/.ssh/${KEY_PAIR_NAME}.pem ubuntu@${EC2_PUBLIC_IP}"
echo "2. Follow the application deployment steps to install Node.js and run your app."
echo "----------------------------------------------------------------------------------"