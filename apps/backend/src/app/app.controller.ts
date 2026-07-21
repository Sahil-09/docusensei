import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ClerkAuthGuard, CurrentUser } from '../auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('protected')
  @UseGuards(ClerkAuthGuard)
  getProtectedData(@CurrentUser() user: any) {
    return {
      message: 'This is a protected route',
      user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  @UseGuards(ClerkAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  @Get("/debug-sentry")
  getError() {
    throw new Error("My first Sentry error!");
  }
}
