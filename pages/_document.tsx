import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Mina a une Idée</title>
        <meta name="description" content="Une IA pour concevoir des idées de business." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}