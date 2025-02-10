

exports.handler = async function (event, context) {
    const message = process.env.MESSAGE
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ message: `Hello, ${message} World!` }),
    };
};