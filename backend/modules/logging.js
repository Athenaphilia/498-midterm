// logging-middleware.js

function requestLogger(req, res, next) {
  // Store the start time
  const startTime = Date.now();
  
  // Override res.end to capture response data
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    // Calculate response time
    const duration = Date.now() - startTime;
    
    // Log the request details
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Call the original end method
    originalEnd.call(res, chunk, encoding);
  };
  
  next();
}

function detailedLogger(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    console.log(JSON.stringify(logData));
    
    originalEnd.call(res, chunk, encoding);
  };
  
  next();
}

module.exports = {
  requestLogger: requestLogger,
  detailedLogger: detailedLogger
};
