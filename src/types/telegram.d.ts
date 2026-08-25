interface TelegramLoginWidget {
  auth(options: {
    bot_id: string;
    on_auth: (user: string) => void;
  }): void;
}

interface Window {
  Telegram?: {
    LoginWidget: TelegramLoginWidget;
  };
}
