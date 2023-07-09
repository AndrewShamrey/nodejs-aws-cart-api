import { destroyAll } from 'db/utils/getKnexInstance';
import * as dotenv from 'dotenv';

dotenv.config();

export const script = (handler: () => void): void => {
  (async () => {
    try {
      await handler();
      console.log('Done');
    } catch (error) {
      console.error(error.message);
    } finally {
      await destroyAll();
    }
  })().catch((error) => {
    console.error(error.message);
    console.error('Force shutting down');
    process.exit();
  });
};
