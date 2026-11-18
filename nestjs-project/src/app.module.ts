import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BooksModule } from './books/books.module.js';
import { DemoUserMiddleware } from './auth/demo-user.middleware.js';
import { RolesGuard } from './auth/roles.guard.js';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';

@Module({
  imports: [BooksModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DemoUserMiddleware).forRoutes('*path');
  }
}
