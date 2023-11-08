module.exports.validateCustomerData = (data) => {
  const { name, email, phone } = data;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9]+$/;
  return name.trim() !== '' && emailRegex.test(email.trim()) && phoneRegex.test(phone.trim());
};
