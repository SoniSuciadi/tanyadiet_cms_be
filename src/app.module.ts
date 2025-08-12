import { Module, RequestMethod } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR, MiddlewareBuilder } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HandleError } from './common/interceptors/handleError.interceptor';
import { AuthenticationMiddleware } from './common/middlewares/authentication.middleware';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './common/database/database.module';
import { SseModule } from './modules/sse/sse.module';
import { ClassListModule } from './modules/class-list/class-list.module';
import { ClassOrderModule } from './modules/class-order/class-order.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DocumentModule } from './modules/document/document.module';
import { OrderModule } from './modules/order/order.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiAgentModule } from './modules/aiagent/aiagent.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    SseModule,
    ClassListModule,
    ClassOrderModule,
    CustomerModule,
    DocumentModule,
    OrderModule,
    StorageModule,
    AiAgentModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HandleError,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareBuilder) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/refresh-token',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/logout',
          method: RequestMethod.GET,
        },
        'stream',
      )
      .forRoutes('*');
  }
}
