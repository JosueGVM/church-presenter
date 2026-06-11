export const LABEL_COLORS = { 
    'INTRO': '#7ed6df', 
    'ESTROFA': '#badc58', 
    'CORO': '#ff7979', 
    'PUENTE': '#686de0', 
    'MUSICA': '#95afc0', 
    'FINAL': '#e056fd', 
    'DEFAULT': '#555' 
};

export const getLabelColor = (label) => {
  const clean = label.replace(/[\[\]0-9]/g, '').trim().toUpperCase();
  return LABEL_COLORS[clean] || LABEL_COLORS.DEFAULT;
};