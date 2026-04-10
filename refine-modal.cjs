const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldModal = `{selectedSavedVessel && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-[#000000] border border-white/5 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Search size={20} className="text-[#0A84FF]" />
                      Detalle de Nave: {selectedSavedVessel.nombre}
                    </h3>
                    <button onClick={() => setSelectedSavedVessel(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    {/* Características Técnicas */}
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Características Técnicas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Matrícula</p>
                        <p className="text-white font-medium">{selectedSavedVessel.matricula}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Arqueo Bruto</p>
                        <p className="text-white font-medium">{selectedSavedVessel.arqueoBruto}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Arqueo Neto</p>
                        <p className="text-white font-medium">{selectedSavedVessel.arqueoNeto}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Eslora</p>
                        <p className="text-white font-medium">{selectedSavedVessel.eslora}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Manga</p>
                        <p className="text-white font-medium">{selectedSavedVessel.manga}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Puntal</p>
                        <p className="text-white font-medium">{selectedSavedVessel.puntal}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Capacidad de Bodega</p>
                        <p className="text-white font-medium">{selectedSavedVessel.capacidadBodega}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Radiobaliza</p>
                        <p className="text-white font-medium">{selectedSavedVessel.tieneRadiobaliza} {selectedSavedVessel.codRadiobaliza ? \`(\${selectedSavedVessel.codRadiobaliza})\` : ''}</p>
                      </div>
                    </div>

                    {/* Propietarios */}
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Propietarios</h4>
                    {selectedSavedVessel.propietarios && selectedSavedVessel.propietarios.length > 0 ? (
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/5">
                            <tr>
                              <th className="px-4 py-3">Nombre</th>
                              <th className="px-4 py-3">Doc. Identidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSavedVessel.propietarios.map((prop, idx) => (
                              <tr key={idx} className="border-b border-white/5 last:border-0">
                                <td className="px-4 py-3 font-medium text-white">{prop.nombre}</td>
                                <td className="px-4 py-3">{prop.docIdentidad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No se encontraron propietarios.</p>
                    )}
                  </div>
                  <div className="p-5 border-t border-white/5 flex justify-end">
                    <button onClick={() => setSelectedSavedVessel(null)} className="bg-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}`;

const newModal = `{selectedSavedVessel && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-[#000000] border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 bg-[#1C1C1E]/80 backdrop-blur-3xl border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                        <Search size={20} className="text-[#0A84FF]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white leading-tight">{selectedSavedVessel.nombre}</h3>
                        <p className="text-sm text-[#0A84FF] font-medium">{selectedSavedVessel.matricula}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSavedVessel(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Card: Características Técnicas */}
                    <div className="bg-[#1C1C1E]/40 border border-white/5 rounded-2xl p-6">
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#0A84FF]"></div>
                        Características Técnicas
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Arqueo Bruto</p>
                          <p className="text-white font-medium">{selectedSavedVessel.arqueoBruto || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Arqueo Neto</p>
                          <p className="text-white font-medium">{selectedSavedVessel.arqueoNeto || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Eslora</p>
                          <p className="text-white font-medium">{selectedSavedVessel.eslora || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Manga</p>
                          <p className="text-white font-medium">{selectedSavedVessel.manga || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Puntal</p>
                          <p className="text-white font-medium">{selectedSavedVessel.puntal || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Capacidad de Bodega</p>
                          <p className="text-white font-medium">{selectedSavedVessel.capacidadBodega || '-'}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-3 pt-4 border-t border-white/5">
                          <p className="text-xs text-gray-500 mb-1">Radiobaliza</p>
                          <div className="flex items-center gap-2">
                            <span className={\`px-2 py-1 rounded-md text-xs font-medium \${selectedSavedVessel.tieneRadiobaliza === 'SI' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}\`}>
                              {selectedSavedVessel.tieneRadiobaliza}
                            </span>
                            {selectedSavedVessel.codRadiobaliza && (
                              <span className="text-white font-medium text-sm">{selectedSavedVessel.codRadiobaliza}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card: Propietarios */}
                    <div className="bg-[#1C1C1E]/40 border border-white/5 rounded-2xl p-6">
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Propietarios
                      </h4>
                      {selectedSavedVessel.propietarios && selectedSavedVessel.propietarios.length > 0 ? (
                        <div className="space-y-3">
                          {selectedSavedVessel.propietarios.map((prop, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                                  <User size={16} />
                                </div>
                                <span className="font-medium text-white">{prop.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg">
                                <span className="text-xs uppercase">Doc:</span>
                                <span className="font-mono text-gray-200">{prop.docIdentidad}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/5 rounded-xl border border-white/5 border-dashed">
                          <p className="text-gray-500 italic">No se encontraron propietarios registrados.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="p-5 border-t border-white/5 bg-[#1C1C1E]/80 backdrop-blur-3xl flex justify-end">
                    <button onClick={() => setSelectedSavedVessel(null)} className="bg-[#0A84FF] hover:bg-[#007AFF] active:scale-95 transition-all duration-200 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-[#0A84FF]/20">
                      Cerrar Detalles
                    </button>
                  </div>
                </div>
              </div>
            )}`;

// Replace the modal
content = content.replace(oldModal, newModal);

fs.writeFileSync('src/App.tsx', content);
console.log('Modal refined.');
