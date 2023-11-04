module.exports.getKnowledge = async (agentName) => {
    const base = ''
    if (agentName === 'Hilda') {
      return '';
    }
  
    if (agentName === 'Ajoke') {
      return '';
    }
  
    if (agentName === 'Ayeesha') {
        console.log('Hello! I am Ayeesha! Here to help you with what you may need today ');
      if (userQuery.toLowerCase() == "What is your name? "){
        return "My name is Ayeesha.";

      } else if (userQuery.toLowerCase().includes(" ")){
        return " ";
      }
    }
    else {
        return "I am sorry, I do not have that specific information at the moment";
    }
  
    return '';
  };
