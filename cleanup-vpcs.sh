#!/bin/bash
set -e

echo "🚨 WARNING: This script will delete all NON-DEFAULT VPCs and their resources in ALL AWS regions."
read -p "Type 'delete all vpcs' to confirm this irreversible action: " CONFIRMATION

if [ "$CONFIRMATION" != "delete all vpcs" ]; then
    echo "Confirmation failed. Aborting."
    exit 1
fi

# Get a list of all accessible regions
REGIONS=$(aws ec2 describe-regions --query "Regions[].RegionName" --output text)

for REGION in $REGIONS; do
    echo "================================================="
    echo "🔎 Checking region: $REGION"
    echo "================================================="

    # Get all non-default VPC IDs in the region
    VPC_IDS=$(aws ec2 describe-vpcs --region $REGION --filters "Name=isDefault,Values=false" --query "Vpcs[].VpcId" --output text)

    if [ -z "$VPC_IDS" ]; then
        echo "No non-default VPCs found in $REGION."
        continue
    fi

    for VPC_ID in $VPC_IDS; do
        echo "🗑️  Preparing to delete VPC: $VPC_ID in region: $REGION"

        # Terminate EC2 instances in the VPC
        INSTANCE_IDS=$(aws ec2 describe-instances --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Reservations[].Instances[].InstanceId" --output text)
        if [ ! -z "$INSTANCE_IDS" ]; then
            echo "   -> Terminating EC2 instances: $INSTANCE_IDS"
            aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_IDS > /dev/null
            echo "   -> Waiting for instances to terminate..."
            aws ec2 wait instance-terminated --region $REGION --instance-ids $INSTANCE_IDS
        fi

        # Detach and delete Internet Gateways
        IGW_IDS=$(aws ec2 describe-internet-gateways --region $REGION --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query "InternetGateways[].InternetGatewayId" --output text)
        for IGW_ID in $IGW_IDS; do
            echo "   -> Detaching and deleting Internet Gateway: $IGW_ID"
            aws ec2 detach-internet-gateway --region $REGION --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
            aws ec2 delete-internet-gateway --region $REGION --internet-gateway-id $IGW_ID
        done

        # Delete subnets
        SUBNET_IDS=$(aws ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[].SubnetId" --output text)
        for SUBNET_ID in $SUBNET_IDS; do
            echo "   -> Deleting Subnet: $SUBNET_ID"
            aws ec2 delete-subnet --region $REGION --subnet-id $SUBNET_ID
        done

        # Delete route tables (non-main)
        RT_IDS=$(aws ec2 describe-route-tables --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" --query "RouteTables[].RouteTableId" --output text)
        for RT_ID in $RT_IDS; do
             echo "   -> Deleting Route Table: $RT_ID"
             aws ec2 delete-route-table --region $REGION --route-table-id $RT_ID
        done

        # Delete security groups (non-default)
        SG_IDS=$(aws ec2 describe-security-groups --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query "SecurityGroups[?GroupName!='default'].GroupId" --output text)
        for SG_ID in $SG_IDS; do
            echo "   -> Deleting Security Group: $SG_ID"
            aws ec2 delete-security-group --region $REGION --group-id $SG_ID
        done

        # Finally, delete the VPC
        echo "   -> Deleting VPC: $VPC_ID"
        aws ec2 delete-vpc --region $REGION --vpc-id $VPC_ID
        echo "✅ VPC $VPC_ID deleted successfully from $REGION."
    done
done

echo "🎉 Cleanup complete!"