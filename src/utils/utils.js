import { gcoresGeojson } from '../static/audio_counties';

// sort funcs
const sortDateFunc = (a, b) => new Date(b.created_at) - new Date(a.created_at);
const sortDateFuncReverse = (a, b) => sortDateFunc(b, a);
const sortLikesFunc = (a, b) => b.likes_count - a.likes_count;
const sortLikesFuncReverse = (a, b) => sortLikesFunc(b, a);
const sortCommentsFunc = (a, b) => b.comments_count - a.comments_count;
const sortCommentsFuncReverse = (a, b) => sortCommentsFunc(b, a);
const sortBookmarksFunc = (a, b) => b.bookmarks_count - a.bookmarks_count;
const sortBookmarksFuncReverse = (a, b) => sortBookmarksFunc(b, a);

const getSortDjsByAttr = (s, attr) => {
  const djsAttr = {};
  s.forEach((a) => {
    const { djs } = a;
    const value = a[attr];
    for (const d of djs) {
      djsAttr[d] = djsAttr[d] === undefined ? value : djsAttr[d] + value;
    }
  });
  return Object.keys(djsAttr).sort((a, b) => djsAttr[b] - djsAttr[a]);
};
const getSortDjsByAttrReverse = (s, attr) => getSortDjsByAttr(s, attr).reverse();

const filterYear = (activities, year) => {
  if (year === 'Total') {
    return activities;
  }
  const s = [];
  activities.forEach((audio) => {
    if (audio.created_at.slice(0, 4) === year) {
      s.push(audio);
    }
  });
  return s;
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

  const hDisplay = h > 0 ? h + (h === 1 ? ' hour ' : ' hours ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute ' : ' minutes ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second ' : ' seconds') : '';
  return `(${hDisplay}${mDisplay}${sDisplay})`;
}

// Utilities
const intComma = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// for scroll to the map
const scrollToMap = () => {
  const el = document.querySelector('.fl.w-100.w-70-l');
  const rect = el.getBoundingClientRect();
  window.scroll(rect.left + window.scrollX, rect.top + window.scrollY);
};

const geoJsonForMap = () => gcoresGeojson;

export {
  filterAndSortAudios, filterYear, filterDjs, sortDateFunc, sortDateFuncReverse, secondsToHms, scrollToMap, intComma,
  sortLikesFunc, sortLikesFuncReverse, sortCommentsFunc, sortCommentsFuncReverse, sortBookmarksFunc, sortBookmarksFuncReverse,
  getSortDjsByAttr, getSortDjsByAttrReverse, geoJsonForMap,
};
