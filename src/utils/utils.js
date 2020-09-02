const filterYearAudios = ((audio, year) => audio.created_at.slice(0, 4) === year);

const sortDateFunc = (a, b) => new Date(b) - new Date(a);
const sortDateFuncReverse = (a, b) => new Date(a) - new Date(b);

const filterAndSortAudios = (activities, year, sortFunc) => {
  let s = activities;
  if (year !== 'Total') {
    const s = activities.filter((audio) => filterYearAudios(audio, year));
  }
  return s.sort(sortFunc);
};

export { filterAndSortAudios,  sortDateFunc,  sortDateFuncReverse }