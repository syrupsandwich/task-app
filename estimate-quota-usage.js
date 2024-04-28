/* exported estimateQuotaUsage */
function estimateQuotaUsage() {
  let mebibyte = 1048576;
  let dataString = JSON.stringify(localStorage);
  let size = dataString.length;
  let storageLimit = mebibyte * 5;
  let percentage = (size / storageLimit) * 100;
  return parseFloat(percentage.toFixed(2));
}
