const filterYearAudios = ((audio, year) => audio.created_at.slice(0, 4) === year);

const sortDateFunc = (a, b) => new Date(b) - new Date(a);
const sortDateFuncReverse = (a, b) => new Date(a) - new Date(b);

const filterYear = (activities, year) => {
  if (year === 'Total') {
    return activities;
  }
  activities.filter((audio, year) => audio.created_at.slice(0, 4) === year);
  return activities;
};

const filterDjs = (activities, djsName) => {
  const s = [];
  activities.forEach((audio) => {
    if (audio.djs.includes(djsName)) {
      s.push(audio);
    }
  });
  return s;
};

const filterAndSortAudios = (activities, filterFunc, item, sortFunc) => {
  const s = filterFunc(activities, item);
  return s.sort(sortFunc);
};

function secondsToHms(d) {
  d = Number(d);
  const h = Math.floor(d / 3600);
  const m = Math.floor(d % 3600 / 60);
  const s = Math.floor(d % 3600 % 60);

  const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';
  return hDisplay + mDisplay + sDisplay;
}

// Utilities
const intComma = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// for scroll to the map
const scrollToMap = () => {
  const el = document.querySelector('.fl.w-100.w-70-l');
  const rect = el.getBoundingClientRect();
  window.scroll(rect.left + window.scrollX, rect.top + window.scrollY);
};

export {
  filterAndSortAudios, filterYear, filterDjs, sortDateFunc, sortDateFuncReverse, secondsToHms, scrollToMap, intComma,
};
