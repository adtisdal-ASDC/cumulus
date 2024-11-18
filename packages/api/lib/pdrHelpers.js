'use strict';

const pvl = require('@cumulus/pvl');
const executions = require('@cumulus/api-client/executions');

/**
 * Generate Short PAN message
 *
 * @param {Array} executionArns list of execution arns
 * @returns {string} the PAN message
 */
async function generateShortPAN(executionArns) {
  let disposition = 'SUCCESSFUL';
  const excs = await Promise.all(
    executionArns.map((arn) =>
      executions.getExecution({ prefix: process.env.stackName, arn: arn }))
  );
  if (excs.some((exc) => exc.status === 'failed')) {
    disposition = 'FAILED';
  }
  return pvl.jsToPVL(
    new pvl.models.PVLRoot()
      .add('MESSAGE_TYPE', new pvl.models.PVLTextString('SHORTPAN'))
      .add('DISPOSITION', new pvl.models.PVLTextString(disposition))
      .add('TIME_STAMP', new pvl.models.PVLDateTime(new Date()))
  );
}

/**
 * Generate a PDRD message with a given err
 *
 * @param {object} err - the error object
 * @returns {string} the PDRD message
 */
function generatePDRD(err) {
  return pvl.jsToPVL(
    new pvl.models.PVLRoot()
      .add('MESSAGE_TYPE', new pvl.models.PVLTextString('SHORTPDRD'))
      .add('DISPOSITION', new pvl.models.PVLTextString(err.message))
  );
}

module.exports = {
  generateShortPAN,
  generatePDRD,
};
