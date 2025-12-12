// Corrections JavaScript pour Appsmith

// Fonction pour appliquer les corrections de layout
function applySidebarFixes() {
  // Masquer la navigation native d'Appsmith
  const navbar = document.querySelector('.appsmith-navbar, .bp3-navbar');
  if (navbar) {
    navbar.style.display = 'none';
  }

  // Ajuster le conteneur principal
  const canvasContainer = document.querySelector('.appsmith-canvas-container, .canvas-container');
  if (canvasContainer) {
    canvasContainer.style.marginLeft = '220px';
    canvasContainer.style.width = 'calc(100% - 220px)';
    canvasContainer.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
  }

  // Corriger les tables qui débordent
  const tables = document.querySelectorAll('.appsmith-table-widget, .table-widget');
  tables.forEach(table => {
    table.style.maxWidth = '100%';
    table.style.overflowX = 'auto';
  });

  // Corriger les modales
  const modals = document.querySelectorAll('.appsmith-modal, .bp3-dialog');
  modals.forEach(modal => {
    modal.style.maxWidth = 'calc(100vw - 240px)';
    modal.style.marginLeft = '0';
  });
}

// Fonction pour gérer le responsive
function handleResponsive() {
  const isMobile = window.innerWidth <= 768;
  const canvasContainer = document.querySelector('.appsmith-canvas-container, .canvas-container');
  
  if (canvasContainer) {
    if (isMobile) {
      canvasContainer.style.marginLeft = '0';
      canvasContainer.style.width = '100%';
    } else {
      canvasContainer.style.marginLeft = '220px';
      canvasContainer.style.width = 'calc(100% - 220px)';
    }
  }
}

// Observer pour détecter les changements dans le DOM
function setupDOMObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldApplyFixes = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Vérifier si de nouveaux éléments Appsmith ont été ajoutés
        const addedNodes = Array.from(mutation.addedNodes);
        const hasAppsmithElements = addedNodes.some(node => 
          node.nodeType === 1 && (
            node.classList?.contains('appsmith-widget') ||
            node.classList?.contains('canvas-container') ||
            node.querySelector?.('.appsmith-widget, .canvas-container')
          )
        );
        
        if (hasAppsmithElements) {
          shouldApplyFixes = true;
        }
      }
    });
    
    if (shouldApplyFixes) {
      setTimeout(applySidebarFixes, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

// Initialisation
function initAppsmithFixes() {
  // Appliquer les corrections immédiatement
  applySidebarFixes();
  
  // Configurer l'observer pour les changements futurs
  setupDOMObserver();
  
  // Gérer le redimensionnement de la fenêtre
  window.addEventListener('resize', handleResponsive);
  
  // Réappliquer les corrections périodiquement (au cas où)
  setInterval(applySidebarFixes, 5000);
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppsmithFixes);
} else {
  initAppsmithFixes();
}

// Exporter pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applySidebarFixes,
    handleResponsive,
    initAppsmithFixes
  };
}