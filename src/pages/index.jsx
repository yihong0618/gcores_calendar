import React, { useState, useEffect } from 'react';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import { Helmet } from 'react-helmet';

import { Link, graphql } from 'gatsby';
import Layout from '../components/layout';
import { activities, djs } from '../static/audios';
import GitHubSvg from '../../assets/github.svg';
import {
  filterAndSortAudios, secondsToHms, filterYear, filterDjs, scrollToMap, intComma,
  sortDateFunc, sortDateFuncReverse, sortLikesFunc, sortLikesFuncReverse,
  sortCommentsFunc, sortCommentsFuncReverse, sortBookmarksFunc, sortBookmarksFuncReverse,
  getSortDjsByAttr, getSortDjsByAttrReverse, geoJsonForMap,
} from '../utils/utils';
import {
  audioAttrMap, audioRoot, djsRoot, lightPlaces, MAPBOX_TOKEN,
} from '../utils/const';
import styles from './gocres.module.scss';

// const
let yearsArr = [];
const yearDJSMap = new Map();
const yearDurationMap = new Map();

// generate base attr
((items) => {
  const yearDJS = {};
  const yearDuration = {};
  items.forEach(
    (item) => {
      const y = item.created_at.slice(0, 4);
      // ignore the first
      if (+y > 2000) {
        yearsArr.push(y);
        // must copy !!!
        const djsArr = item.djs.slice();
        if (yearDJS[y] === undefined) {
          yearDJS[y] = djsArr;
        } else {
          yearDJS[y].push(...djsArr);
        }
        yearDuration[y] = (yearDuration[y] === undefined ? item.duration : yearDuration[y] + item.duration);
      }
    },
  );
  yearsArr = [...new Set(yearsArr)].sort().reverse();

  // set year djs attr
  const yearDjsArr = Object.entries(yearDJS);
  const totalArr = [];
  yearDjsArr.forEach((djs) => {
    const yearDjsSet = new Set(djs[1]);
    yearDJSMap.set(djs[0], [...yearDjsSet]);
    totalArr.push(...yearDjsSet);
  });
  yearDJSMap.set('Total', [...new Set(totalArr)]);

  // set year duration attr
  let totalDuration = 0;
  const yearDurationArr = Object.entries(yearDuration);
  yearDurationArr.forEach((d) => {
    totalDuration += d[1];
    yearDurationMap.set(d[0], secondsToHms(d[1]));
  });
  yearDurationMap.set('Total', secondsToHms(totalDuration));
})(activities);

let thisYear = '';
if (yearsArr) {
  [thisYear] = yearsArr;
}

// djs info
const djsObj = {};
djs.forEach((d) => {
  djsObj[d.user_id] = d.nickname;
});

// Page
export default ({ data }) => {
  const [year, setYear] = useState(thisYear);
  const [audios, setActivity] = useState(filterAndSortAudios(activities, filterYear, year, sortDateFunc));
  const [singleAudio, setSingleAudio] = useState('');
  const [djs, setDjs] = useState(yearDJSMap.get(thisYear));
  const [singleDjs, setSingleDjs] = useState('');
  const [audioIndex, setAudioIndex] = useState(-1);

  const changeYear = (year) => {
    setYear(year);
    setDjs(yearDJSMap.get(year));
    setSingleAudio('');
    setSingleDjs('');
    scrollToMap();
    setActivity(filterAndSortAudios(activities, filterYear, year, sortDateFunc));
    setAudioIndex(-1);
  };

  const locateActivity = (audio) => {
    scrollToMap();
    setSingleAudio(audio);
  };

  const changeDjs = (djsName) => {
    setSingleDjs(djsName);
    setActivity(filterAndSortAudios(activities, filterDjs, djsName, sortDateFunc));
    setAudioIndex(-1);
  };

  // add total page svg click event
  useEffect(() => {
    if (year !== 'Total') {
      return;
    }
    let rectArr = document.querySelectorAll('rect');
    if (rectArr.length !== 0) {
      rectArr = Array.from(rectArr).slice(1);
    }

    rectArr.forEach((rect) => {
      const rectColor = rect.getAttribute('fill');
      // not run has no click event
      if (rectColor !== '#444444') {
        const audioDate = rect.innerHTML;
        // ingnore the error
        const [audioName] = audioDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || [];
        const audioLocate = audios.filter(
          (r) => r.created_at.slice(0, 10) === audioName,
        ).sort((a, b) => b.likes_count - a.likes_count)[0];

        // do not add the event next time
        // maybe a better way?
        if (audioLocate) {
          rect.onclick = () => locateActivity(audioLocate);
        }
      }
    });
  }, year);

  return (
    <>
      <Helmet bodyAttributes={{ class: styles.body }} />
      <Layout>
        <div className="mb5">
          <div className="w-100">
            <h1 className="f1 fw9 i">Gcores Audio</h1>
          </div>
          <YearsStat audios={activities} year={year} onClick={changeYear} />
          <div className="fl w-100 w-70-l">
            <AudiosMap
              data={data}
              audios={audios}
              year={year}
              changeDjs={changeDjs}
              changeYear={changeYear}
              djs={djs}
            />
            {singleDjs && (
            <SingleDjsInfo
              djsId={singleDjs}
              audios={audios}
            />
            )}
            {singleAudio && (
            <AudioInfo
              data={data}
              singleAudio={singleAudio}
              changeDjs={changeDjs}
            />
            )}
            {year === 'Total' ? <TotalStat />
              : (
                <AudioTable
                  audios={audios}
                  year={year}
                  djs={djs}
                  locateActivity={locateActivity}
                  setActivity={setActivity}
                  setDjs={setDjs}
                  audioIndex={audioIndex}
                  setAudioIndex={setAudioIndex}
                />
              )}
          </div>
        </div>
      </Layout>
    </>
  );
};

// Child components
const ImgFiles = ({
  data, djs, year, changeDjs, smallSize,
}) => {
  const avatarSize = year === 'Total' || smallSize ? 2 : 3;
  const url = year === 'Total' ? djsRoot : '#';
  const getDjsId = (s) => s.node.image.originalName.split('.')[0];
  let avatars = data.avatars.edges;
  // filter and sort djs map
  avatars = avatars.filter((a) => djs.includes(getDjsId(a)));
  avatars = avatars.sort((a, b) => (djs.indexOf(getDjsId(a)) - djs.indexOf(getDjsId(b))));

  const handleClick = (djsRootName) => {
    const djsName = djsRootName.split('.')[0];
    changeDjs(djsName);
  };
  return (
    <>
      {avatars.map((edge) => (
        <Link to={url + getDjsId(edge)} key={getDjsId(edge)}>
          <picture key={getDjsId(edge)} title={djsObj[getDjsId(edge)]} onClick={() => handleClick(edge.node.image.originalName)} className={styles.picture}>
            <source
              srcSet={edge.node.image.srcSet}
              type="image/jpeg"
            />
            <source
              srcSet={edge.node.image.srcSetWebp}
              type="image/webp"
            />
            <img
              className={`dib w${avatarSize} h${avatarSize} br-100`}
              src={edge.node.image.base64}
            />
          </picture>
        </Link>
      ))}
    </>
  );
};

// stat on 'Total' page
const TotalStat = () => (
  <div>
    <GcoresMap />
    <GitHubSvg className={styles.audioSVG} />
  </div>
);

const YearsStat = ({ audios, year, onClick }) => {
  // make sure the year click on front
  let yearsArrayUpdate = yearsArr.slice();
  yearsArrayUpdate = yearsArrayUpdate.filter((x) => x !== year);
  yearsArrayUpdate.unshift(year);

  // for short solution need to refactor
  return (
    <div className="fl w-100 w-30-l pb5 pr5-l">
      <section className="pb4" style={{ paddingBottom: '0rem' }}>
        <p>
          机核
          {yearsArr.length}
          年了，
          {yearsArr.length}
          年不容易祝机核越来越好。下面是
          {year}
          的电台数据
          <br />
        </p>
      </section>
      <hr color="#0f99a1" />
      {yearsArrayUpdate.map((year) => (
        <YearStat key={year} audios={audios} year={year} onClick={onClick} />
      ))}
      <YearStat key="Total" audios={audios} year="Total" onClick={onClick} />
    </div>
  );
};

const YearStat = ({ audios, year, onClick }) => {
  if (yearsArr.includes(year)) {
    audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  }
  let sumLikes = 0;
  let sumBookmarks = 0;
  let sumComments = 0;
  const djsSet = new Set();
  audios.forEach((audio) => {
    if (audio.likes_count) {
      sumLikes += audio.likes_count || 0;
    }
    if (audio.bookmarks_count) {
      sumBookmarks += audio.bookmarks_count || 0;
    }
    if (audio.comments_count) {
      sumComments += audio.comments_count || 0;
    }
    if (audio.djs) {
      const { djs } = audio;
      djs.forEach((d) => {
        djsSet.add(d);
      });
    }
  });
  return (
    <div style={{ cursor: 'pointer' }} onClick={() => onClick(year)}>
      <section>
        <Stat value={year} description=" Audios" />
        <Stat value={audios.length} description=" 期" />
        <Stat value={sumLikes} description=" Likes" />
        <Stat value={sumBookmarks} description=" Marks" />
        <Stat value={sumComments} description=" Comments" />
        <Stat value={[...djsSet].length} description=" DJS" />
      </section>
      <hr color="#0f99a1" />
    </div>
  );
};

const AudiosMap = ({
  data, changeDjs, changeYear, djs, year,
}) => {
  const duration = yearDurationMap.get(year);
  return (
    <div>
      <RunMapButtons changeYear={changeYear} />
      <h2 style={{ color: '#012033' }}>
        {year}
        {' '}
        电台时长
        {' '}
        {duration}
      </h2>
      <ImgFiles data={data} djs={djs} year={year} changeDjs={changeDjs} />
    </div>
  );
};

const AudioInfo = ({ data, singleAudio, changeDjs }) => (
  <div>
    <h2 color="#012033"><a target="_blank" href={`${audioRoot}${singleAudio.audio_id}`} color="#012033">{singleAudio.title}</a></h2>
    <ImgFiles data={data} djs={singleAudio.djs.slice()} smallSize changeDjs={changeDjs} />
  </div>
);

const RunMapButtons = ({ changeYear }) => {
  const yearsButtons = yearsArr.slice();
  yearsButtons.push('Total');
  const [index, setIndex] = useState(0);
  const handleClick = (e, year) => {
    const elementIndex = yearsButtons.indexOf(year);
    e.target.style.color = 'rgb(244, 67, 54)';

    const elements = document.getElementsByClassName(styles.button);
    elements[index].style.color = '#0f99a1';
    setIndex(elementIndex);
  };
  return (
    <div>
      <ul className={styles.buttons}>
        {yearsButtons.map((year) => (
          <li
            key={`${year}button`}
            style={{ color: year === '2020' ? 'rgb(244, 67, 54)' : '#0f99a1' }}
            year={year}
            onClick={(e) => {
              changeYear(year);
              handleClick(e, year);
            }}
            className={styles.button}
          >
            {year}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AudioTable = ({
  audios, year, locateActivity, setActivity, setDjs, audioIndex, setAudioIndex,
}) => {
  const [sortFuncInfo, setSortFuncInfo] = useState('');

  let fDjsSort = getSortDjsByAttr;
  const sortLikesFuncTable = sortFuncInfo === 'Likes' ? sortLikesFunc : sortLikesFuncReverse;
  const sortCommentsFuncTable = sortFuncInfo === 'Comments' ? sortCommentsFunc : sortCommentsFuncReverse;
  const sortBookmarksFuncTable = sortFuncInfo === 'Bookmarks' ? sortBookmarksFunc : sortBookmarksFuncReverse;
  const sortDateFuncTable = sortFuncInfo === 'Date' ? sortDateFunc : sortDateFuncReverse;

  const sortFuncMap = new Map([
    ['Likes', sortLikesFuncTable],
    ['Comments', sortCommentsFuncTable],
    ['Bookmarks', sortBookmarksFuncTable],
    ['Date', sortDateFuncTable],
  ]);
  const handleClick = (e) => {
    const attrName = e.target.innerHTML;
    if (sortFuncInfo === attrName) {
      setSortFuncInfo('');
      fDjsSort = getSortDjsByAttr;
    } else {
      setSortFuncInfo(attrName);
      fDjsSort = getSortDjsByAttrReverse;
    }
    const fTableSort = sortFuncMap.get(attrName);
    setActivity(audios.sort(fTableSort));
    setDjs(fDjsSort(filterAndSortAudios(activities, filterYear, year, fTableSort), audioAttrMap.get(attrName)));
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.audioTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            {Array.from(sortFuncMap.keys()).map((k) => (
              <th key={k} onClick={(e) => handleClick(e)}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {audios.map((audio) => (
            <AudioRow
              audios={audios}
              audio={audio}
              key={audio.audio_id}
              locateActivity={locateActivity}
              audioIndex={audioIndex}
              setAudioIndex={setAudioIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AudioRow = ({
  audios, audio, locateActivity, audioIndex, setAudioIndex,
}) => {
  // change click color
  const handleClick = (e, audios, audio) => {
    const elementIndex = audios.indexOf(audio);
    e.target.parentElement.style.color = 'rgb(244, 67, 54)';

    const elements = document.getElementsByClassName(styles.audioRow);
    if (audioIndex !== -1) {
      elements[audioIndex].style.color = 'rgb(70, 70, 70)';
    }
    setAudioIndex(elementIndex);
    locateActivity(audio);
  };
  const auddioTitleShow = audio.title.length >= 20 ? `${audio.title.slice(0, 20)}...` : audio.title;

  return (
    <tr
      className={styles.audioRow}
      key={audio.audio_id}
      onClick={(e) => {
        handleClick(e, audios, audio);
      }}
    >
      <td title={audio.title}>{auddioTitleShow}</td>
      <td>{audio.likes_count}</td>
      <td>{audio.comments_count}</td>
      <td>{audio.bookmarks_count}</td>
      <td className={styles.audioDate}>{audio.created_at.slice(0, 10)}</td>
    </tr>
  );
};

const Stat = ({
  value, description, className, citySize,
}) => (
  <div className={`${className} pb2 w-100`}>
    <span className={`f${citySize || 1} fw9 i`}>{intComma(value)}</span>
    <span className="f3 fw6 i">{description}</span>
  </div>
);

const GcoresMap = () => {
  const [viewport, setViewport] = useState({
    width: '100%',
    height: 600,
    latitude: 40.21,
    longitude: 117.4219,
    zoom: 3,
  });

  const addControlHandler = (event) => {
    const map = event && event.target;
    // set lauguage to Chinese if you use English please comment it
    if (map) {
      map.addControl(
        new MapboxLanguage({
          defaultLanguage: 'zh',
        }),
      );
      map.setLayoutProperty('country-label-lg', 'text-field', [
        'get',
        'name_zh',
      ]);
    }
  };
  const filterProvinces = lightPlaces.slice();
  // for geojson format
  filterProvinces.unshift('in', 'name');
  const geoData = geoJsonForMap();

  return (
    <ReactMapGL
      {...viewport}
      mapStyle="mapbox://styles/mapbox/dark-v9"
      onViewportChange={setViewport}
      onLoad={addControlHandler}
      mapboxApiAccessToken={MAPBOX_TOKEN}
    >
      <Source id="data" type="geojson" data={geoData}>
        <Layer
          id="prvince"
          type="fill"
          paint={{
            'fill-color': '#f44336',
          }}
          filter={filterProvinces}
        />
        <Layer
          id="gocers"
          type="line"
          paint={{
            'line-color': '#0f99a1',
            'line-width': 1,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />

      </Source>
      <span className={styles.gcoresTitle}>核聚变走过的省市</span>
    </ReactMapGL>
  );
};

const SingleDjsInfo = ({ djsId, audios }) => {
  const djsInfo = {};
  audios.forEach((audio) => {
    djsInfo.duration = djsInfo.duration === undefined ? audio.duration : djsInfo.duration + audio.duration;
    djsInfo.count = djsInfo.count === undefined ? 1 : djsInfo.count + 1;
  });
  return (
    <div className="f3 fw6 i" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
      <li>
        {'昵称: '}
        {djsObj[djsId]}
      </li>
      <li>
        {'总期数: '}
        {djsInfo.count}
      </li>
      <li>
        {'总时长: '}
        {secondsToHms(djsInfo.duration)}
      </li>
    </div>
  );
};

export const query = graphql`
  query AvatarsQuery {
      avatars: allImageSharp
      {
        edges {
          node {
            id
            image: fluid(srcSetBreakpoints: [32, 64, 96], quality: 100) {
              originalName
              src
              srcSet
              srcSetWebp
              base64
          }
        }
      }
    }
  }
`;
