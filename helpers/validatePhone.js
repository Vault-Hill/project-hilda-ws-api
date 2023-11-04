module.exports.validatePhone = (phone) => {
  const phoneRegex = /^\d{11}$/;
  return phoneRegex.test(phone.trim());
};