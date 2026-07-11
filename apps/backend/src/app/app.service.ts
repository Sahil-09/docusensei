import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getData(): Promise<{ message: string; userData: any }> {
    let userData;
    try{
      userData = await this.prisma.user.findMany()
    }catch (e) {
      console.log(e);
    }
    return { message: 'Hello API', userData };
  }
}
