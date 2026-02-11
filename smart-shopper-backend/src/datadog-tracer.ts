import tracer from 'dd-trace';

if (process.env.DD_ENV) {
  tracer.init({
    profiling: true,
    runtimeMetrics: true,
    env: process.env.DD_ENV,
    logInjection: true,
  });
}

export default tracer;
