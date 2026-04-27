import { TEST_BEE_API } from './helpers/test-config';

async function globalSetup() {
  try {
    const res = await fetch(`${TEST_BEE_API}/health`);
    if (!res.ok) {
      throw new Error(`Bee node returned ${res.status}`);
    }
    console.log(`Bee node is healthy at ${TEST_BEE_API}`);
  } catch (e) {
    throw new Error(
      `Bee node is not reachable at ${TEST_BEE_API}. Start your Bee node before running tests.\n${e}`
    );
  }
}

export default globalSetup;
