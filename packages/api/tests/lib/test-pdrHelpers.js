'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');
const { CumulusApiClientError } = require('@cumulus/api-client/CumulusApiClientError');

const fakeExecutionModule = {
  getExecution: ({ arn }) => {
    if (arn === 'arn:successful:execution') {
      return Promise.resolve({
        status: 'completed',
      });
    }

    if (arn === 'arn:failed:execution') {
      return Promise.resolve({
        status: 'failed',
      });
    }
    throw new CumulusApiClientError('Test Error');
  },
};

const pdrHelpers = proxyquire(
  '../../lib/pdrHelpers',
  {
    '@cumulus/api-client/executions': fakeExecutionModule,
  }
);

// eslint-disable-next-line max-len
const successfulRegex = /MESSAGE_TYPE = "SHORTPAN";\nDISPOSITION = "SUCCESSFUL";\nTIME_STAMP = \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z;\n/;
// eslint-disable-next-line max-len
const failedRegex = /MESSAGE_TYPE = "SHORTPAN";\nDISPOSITION = "FAILED";\nTIME_STAMP = \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z;\n/;

test('generateShortPAN successful disposition', async (t) => {
  const executions = [
    'arn:successful:execution',
    'arn:successful:execution',
    'arn:successful:execution',
  ];
  const pan = await pdrHelpers.generateShortPAN(executions);
  t.regex(pan, successfulRegex);
});

test('generateShortPAN failed disposition', async (t) => {
  const executions = [
    'arn:successful:execution',
    'arn:successful:execution',
    'arn:successful:execution',
    'arn:failed:execution',
    'arn:successful:execution',
  ];
  const pan = await pdrHelpers.generateShortPAN(executions);
  t.regex(pan, failedRegex);
});

test('generateShortPAN empty execution list', async (t) => {
  const executions = [];
  const pan = await pdrHelpers.generateShortPAN(executions);
  t.regex(pan, successfulRegex);
});

test('generateShortPAN execution arn not found', async (t) => {
  const executions = [
    'arn:successful:execution',
    'arn:successful:execution',
    'arn:not_found',
  ];
  try {
    await pdrHelpers.generateShortPAN(executions);
    t.fail();
  } catch (error) {
    t.pass();
  }
});
