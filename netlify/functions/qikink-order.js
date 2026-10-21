
exports.handler = async (event) => {
  // SANDBOX ONLY: never change this to the live API.
  const SANDBOX_URL =
    "https://sandbox.qikink.com/api/order/create";

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "POST only" })
    };
  }

  // Keep this key private; use it only from Postman for testing.
  if (
    !process.env.QIKINK_TEST_KEY ||
    event.headers["x-test-key"] !==
      process.env.QIKINK_TEST_KEY
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  const clientId = process.env.QIKINK_CLIENT_ID;
  const accessToken = process.env.QIKINK_ACCESS_TOKEN;

  if (!clientId || !accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Sandbox credentials are not configured"
      })
    };
  }

  let order;

  try {
    order = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  if (
    !order.order_number ||
    !Array.isArray(order.line_items) ||
    order.line_items.length === 0 ||
    !order.shipping_address
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing order number, items, or shipping address"
      })
    };
  }

  try {
    const response = await fetch(SANDBOX_URL, {
      method: "POST",
      headers: {
        "ClientId": clientId,
        "Accesstoken": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const result = await response.text();

    return {
      statusCode: response.ok ? 200 : 502,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        environment: "SANDBOX",
        http_status: response.status,
        qikink_response: result
      })
    };
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({
        environment: "SANDBOX",
        error: "Could not connect to Qikink Sandbox"
      })
    };
  }
};
