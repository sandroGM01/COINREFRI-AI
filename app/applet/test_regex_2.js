const html = `
                                <tr>
                                    <td style="padding: 3px 5px 3px 10px; color: #02749f; font-weight: bold;">
                                        Matricula: PL-69692-CM
                                    </td>

                                </tr>
                                <tr>
                                    <td style="padding: 3px 5px 3px 10px; ">
                                        Nombre: JEHOVA JIREH
                                    </td>

                                </tr>
`;

const extractField = (label) => {
  const regex = new RegExp(`${label}:\\s*([^\\n<]+)`);
  const match = html.match(regex);
  return match ? match[1].trim() : '';
};

console.log("Matricula:", extractField('Matricula'));
console.log("Nombre:", extractField('Nombre'));
