'use strict';

let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    const { createNestApp } = require('../dist/lambda');
    appPromise = createNestApp();
  }
  const app = await appPromise;
  app(req, res);
};
