export default {
  // Export Perfecto (.txt avec ;)
  telechargerPerfecto: async () => {
    try {
      showAlert('📥 Export Perfecto en cours...', 'info');
      await exportPerfecto.run();
      
      let donnees = exportPerfecto.data;
      if (donnees && typeof donnees === 'object' && donnees.response) {
        donnees = donnees.response;
      }
      
      download(donnees, `perfecto_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
      showAlert('✅ Export Perfecto réussi !', 'success');
      
    } catch (erreur) {
      showAlert('❌ Erreur : ' + erreur.message, 'error');
    }
  },
  
  // Export Excel (.xlsx) - CORRIGÉ
  telechargerExcel: async () => {
    try {
      showAlert('📥 Export Excel en cours...', 'info');
      
      // Construire l'URL manuellement
      const url = 'http://host.docker.internal:8001/api/invoices/export_xlsx?status=recorded&include_lines=false';
      
      // Télécharger avec fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': 'dev'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur serveur : ' + response.status);
      }
      
      // Récupérer le blob
      const blob = await response.blob();
      
      // Créer le lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      
      // Nettoyage
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      showAlert('✅ Export Excel réussi !', 'success');
      
    } catch (erreur) {
      console.error('Erreur Excel:', erreur);
      showAlert('❌ Erreur : ' + erreur.message, 'error');
    }
  },
  
  // Export CSV (.csv avec ,)
  telechargerCSV: async () => {
    try {
      showAlert('📥 Export CSV en cours...', 'info');
      await exportCSV.run();
      
      let donnees = exportCSV.data;
      if (donnees && typeof donnees === 'object' && donnees.response) {
        donnees = donnees.response;
      }
      
      download(donnees, `export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      showAlert('✅ Export CSV réussi !', 'success');
      
    } catch (erreur) {
      showAlert('❌ Erreur : ' + erreur.message, 'error');
    }
  }
}