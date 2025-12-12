// Widget personnalisé pour corriger les problèmes de sidebar dans Appsmith
// À ajouter dans un widget HTML/JavaScript dans chaque page Appsmith

(() => {
  // Styles CSS à injecter
  const styles = `
    <style id="sidebar-fixes">
      /* Masquer la navigation native d'Appsmith */
      .appsmith-navbar,
      .bp3-navbar,
      .t--app-viewer-navigation {
        display: none !important;
      }

      /* Ajuster le conteneur principal */
      .appsmith-canvas-container,
      .canvas-container,
      .t--canvas-artboard {
        margin-left: 220px !important;
        width: calc(100% - 220px) !important;
        transition: margin-left 0.3s ease, width 0.3s ease !important;
      }

      /* Corrections pour les widgets */
      .appsmith-widget-container {
        max-width: 100% !important;
        overflow-x: visible !important;
      }

      /* Tables responsives */
      .appsmith-table-widget,
      .t--widget-tablewidget {
        max-width: 100% !important;
        overflow-x: auto !important;
      }

      /* Corrections pour les modales */
      .appsmith-modal-overlay,
      .bp3-overlay {
        z-index: 1050 !important;
      }

      .appsmith-modal,
      .bp3-dialog {
        margin-left: 0 !important;
        max-width: calc(100vw - 240px) !important;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .appsmith-canvas-container,
        .canvas-container,
        .t--canvas-artboard {
          margin-left: 0 !important;
          width: 100% !important;
        }
        
        .appsmith-modal,
        .bp3-dialog {
          max-width: calc(100vw - 20px) !important;
        }
      }
    </style>
  `;

  // Fonction pour appliquer les corrections
  function applySidebarFixes() {
    // Injecter les styles si pas déjà fait
    if (!document.getElementById('sidebar-fixes')) {
      document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Corrections JavaScript supplémentaires
    const elements = {
      navbar: document.querySelector('.appsmith-navbar, .bp3-navbar, .t--app-viewer-navigation'),
      canvas: document.querySelector('.appsmith-canvas-container, .canvas-container, .t--canvas-artboard'),
      tables: document.querySelectorAll('.appsmith-table-widget, .t--widget-tablewidget'),
      modals: document.querySelectorAll('.appsmith-modal, .bp3-dialog')
    };

    // Masquer la navbar
    if (elements.navbar) {
      elements.navbar.style.display = 'none';
    }

    // Ajuster le canvas
    if (elements.canvas) {
      const isMobile = window.innerWidth <= 768;
      elements.canvas.style.marginLeft = isMobile ? '0' : '220px';
      elements.canvas.style.width = isMobile ? '100%' : 'calc(100% - 220px)';
    }

    // Corriger les tables
    elements.tables.forEach(table => {
      table.style.maxWidth = '100%';
      table.style.overflowX = 'auto';
    });

    // Corriger les modales
    elements.modals.forEach(modal => {
      modal.style.maxWidth = 'calc(100vw - 240px)';
    });
  }

  // Observer pour les changements DOM
  const observer = new MutationObserver(() => {
    setTimeout(applySidebarFixes, 100);
  });

  // Initialiser
  function init() {
    applySidebarFixes();
    
    // Observer les changements
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Gérer le redimensionnement
    window.addEventListener('resize', applySidebarFixes);
    
    // Réappliquer périodiquement
    setInterval(applySidebarFixes, 3000);
  }

  // Démarrer quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposer globalement pour debug
  window.sidebarFixes = {
    apply: applySidebarFixes,
    observer: observer
  };
})();