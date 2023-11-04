module.exports.getKnowledge = async (agentName, UserQuery) => {
  const base = 'Powered by VaultHill'
  if (agentName === 'Hilda') {
    return '';
  }

  if (agentName === 'Ajoke') {
    return '';
  }

  if (agentName === 'Ayeesha') {
    console.log('Hello! I am Ayeesha; Here to help you with what you may need today.')
    if (userQuery.toLowerCase() == "  what is your name?"){
      return "My name is Ayeesha.";
    } else if(userQuery.toLowerCase().includes(" ")){
      return " ";

    }
    return '';

  return '';
};
