const appliedFilters = new Set();
function createOverlayFilters(color) {
  const filterSVG = `
  
    <filter id="overlay-filter-${sanitizeColor(color)}">
          <feFlood flood-color="${color}" result="flood"/>
          <feBlend mode="overlay" in2="SourceGraphic" result="blend1"/>
          <feComposite in="blend1" in2="SourceAlpha" operator="in" result="composite2"/>
      </filter>

      <filter id="overlay-multiply-filter-${sanitizeColor(color)}">
          <feFlood flood-color="${color}" result="flood"/>
          <feBlend mode="overlay" in2="SourceGraphic" result="blend1"/>
          <feBlend mode="multiply" in="flood" in2="blend1" result="blend2"/>
          <feComposite in="blend2" in2="SourceAlpha" operator="in" result="composite2"/>
      </filter>
      `;
  document.getElementById("filtrid").innerHTML += filterSVG;
}

function applyOverlayMultiplyFilter(filterType, color) {
  return (
    appliedFilters.has(color) ||
      (createOverlayFilters(color), appliedFilters.add(color)),
    generateFilterUrl(filterType, color)
  );
}

function generateFilterUrl(filterType, color) {
  return `url('#${filterType}-${sanitizeColor(color)}')`;
}

function sanitizeColor(color) {
  return color.replace("#", "");
}

export default applyColorToCosmonauts = (color) => {
  const overlayFilter = applyOverlayMultiplyFilter(
    "overlay-filter",
    `${color}`
  );
  const overlayMultiplyFilter = applyOverlayMultiplyFilter(
    "overlay-multiply-filter",
    `${color}`
  );
  return (userpicStyle = {
    filter: `${overlayFilter} ${overlayMultiplyFilter}`,
  });
};