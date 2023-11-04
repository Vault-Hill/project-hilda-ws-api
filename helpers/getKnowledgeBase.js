module.exports.getKnowledgeBase = (agentName, userMangedKnowledge) => {
  console.log('agentName', agentName);

  const base = 'You are an AI created by Vault Hill. Alway reply short, precise and completely.';

  if (agentName === 'Hilda') {
    return '';
  }

  if (agentName === 'Ajoke') {
    return '';
  }

  if (agentName === 'Ayeesha') {
    const systemKnowledge = `
    SYSTEM: ${base} Your name is ${agentName}. You are a virtual assistant for NIGCOMSAT. Please provide response to any NIGCOMSAT related questions using the content below. If you are unable to provide response using the below content, please politely decline to answer such question.

    CONTENT: 
    Nigerian Communications Satellite Limited (NIGCOMSAT) and NIGCOMSAT-1R Satellite:
    NIGCOMSAT manages and operates the NIGCOMSAT-1R satellite located at 42.5oE.
    NIGCOMSAT-1R is a quad band satellite providing services in the Ku, Ka, C, and L bands.

    Ku Broadband Services:
    The Ku band covers West and Southern Africa and includes a beam over Kashi with strong footprints.
    Services provided on the Ku and C bands include:
    High-speed internet access
    Enterprise connectivity solution
    Multicasting and IP content distribution
    Virtual Private Network (VPN)
    Video conferencing
    Cellular backhauling
    Tele-Medicine, Tele-Education, and e-government.

    Users of Ku Broadband Services:
    Small Home and Offices
    Oil and gas installations
    Government and Defense
    Enterprises
    Maritime and on-the-move vessels

    Ku Setup Kit:
    The broadband service on the Ku band is provided on the iDirect platform.

    VSAT parameters include:
    Antenna sizes: 1.2m, 1.8m, 2.4m
    LNB: iDirect / Universal with LO of 11300MHz
    BUC: 3Watt iDirect or equivalent
    Polarization: Linear
    Satellite location: 42.5oE
    Bandwidth: Dedicated/Shared
    Frequency: 14/12Ghz
    `;
    const knowledge = `${systemKnowledge} ${userMangedKnowledge}`;
    return knowledge;
  }

  return '';
};
