import fs from 'fs';

const html = `
                                <tr>
                                    <td style="padding: 3px 5px 3px 10px; color: #02749f; font-weight: bold;">
                                        Matricula: PL-69692-CM
                                    </td>

                                </tr>
`;

const extractField = (label) => {
  const regex = new RegExp(`${label}:\\s*([^<]+)`);
  const match = html.match(regex);
  return match ? match[1].trim() : '';
};

console.log("Matricula:", extractField('Matricula'));
