import { PartialType } from '@nestjs/swagger';
import { CreateRoommateProfileDto } from './create-roommate-profile.dto';

export class UpdateRoommateProfileDto extends PartialType(CreateRoommateProfileDto) { }