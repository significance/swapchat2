async function globalSetup() {
  try {
    const res = await fetch('http://localhost:1633/health');
    if (!res.ok) {
      throw new Error(`Bee node returned ${res.status}`);
    }
    console.log('Bee node is healthy');
  } catch (e) {
    throw new Error(
      `Bee node is not reachable at localhost:1633. Start your Bee node before running tests.\n${e}`
    );
  }
}

export default globalSetup;
