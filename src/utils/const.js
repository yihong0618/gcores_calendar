const audioAttrMap = new Map([
  ['Likes', 'likes_count'],
  ['Comments', 'comments_count'],
  ['Bookmarks', 'bookmarks_count'],
  ['Date', 'created_at'],
]);

const audioRoot = 'https://www.gcores.com/radios/';
const djsRoot = 'https://www.gcores.com/users/';
const MAPBOX_TOKEN = 'pk.eyJ1IjoieWlob25nMDYxOCIsImEiOiJja2J3M28xbG4wYzl0MzJxZm0ya2Fua2p2In0.PNKfkeQwYuyGOTT_x9BJ4Q';
const lightPlaces = ['北京市', '福建省', '浙江省', '广东省', '上海市'];

export {
  audioAttrMap, audioRoot, djsRoot, MAPBOX_TOKEN, lightPlaces,
};
