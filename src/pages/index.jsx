import React, { useState, useEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import ReactMapGL, { Source, Layer } from 'react-map-gl';

import Layout from '../components/layout';
import { activities } from '../static/audios';
import { chinaGeojson } from '../static/run_countries';
import GitHubSvg from '../../assets/github.svg';
import GridSvg from '../../assets/grid.svg';
import { filterAndSortAudios,  sortDateFunc,  sortDateFuncReverse } from '../utils/utils';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './running.module.scss';

const MAPBOX_TOKEN = 'pk.eyJ1IjoieWlob25nMDYxOCIsImEiOiJja2J3M28xbG4wYzl0MzJxZm0ya2Fua2p2In0.PNKfkeQwYuyGOTT_x9BJ4Q';

// const
let yearsArr = [];


// generate base attr
((items) => {
  const locationsList = [];
  items.forEach(
    (item) => {
      const y = item.created_at.slice(0, 4);
      if ( +y > 2000) {
        yearsArr.push(y);
      }
    },
  );
  yearsArr = [...new Set(yearsArr)].sort().reverse();
})(activities);


// Page
export default () => {
  const onStartPoint = [38.862, 121.514];
  const [year, setYear] = useState('2020');
  const [audios, setActivity] = useState(filterAndSortAudios(activities, year, sortDateFunc));
  const [title, setTitle] = useState('');
  const [viewport, setViewport] = useState({
    width: '100%',
    height: 400,
    latitude: onStartPoint[0],
    longitude: onStartPoint[1],
    zoom: 11.5,
  });
  const changeYear = (year) => {
    setYear(year);
    scrollToMap();
    if (year !== 'Total') {
      setActivity(filterAndSortAudios(activities, year, sortDateFunc));
    } else {
      setActivity(activities);
    }
    if (viewport.zoom > 3) {
      setViewport({
        width: '100%',
        height: 400,
        latitude: onStartPoint[0],
        longitude: onStartPoint[1],
        zoom: 11.5,
      });
    }
    setTitle(`${year} Audios DJS map`);
  };

  const locateActivity = (audio) => {
    scrollToMap();
    setTitle(titleForShow(audio));
  };
  
  // TODO refactor
  useEffect(() => {
    let rectArr = document.querySelectorAll("rect");
    if (rectArr.length !== 0) {
      rectArr = Array.from(rectArr).slice(1)
    }

    rectArr.forEach((rect) => {
      const rectColor = rect.getAttribute("fill");
      // not run has no click event
      if (rectColor !== "#444444") {
        const audioDate = rect.innerHTML;
        const [audioName] = audioDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || ["2021"]
        let audio = audios.filter(
          (r) => r.created_at.slice(0, 10) === audioName
        ).sort((a, b) => b.distance - a.distance)
        
        // do not add the event next time
        // maybe a better way?
        if (audio) {
          rect.onclick = () => console.log(1);
        }
      }
    })

    let polylineArr = document.querySelectorAll("polyline");
    if (polylineArr.length !== 0) {
      polylineArr = Array.from(polylineArr).slice(1)
    }
    polylineArr.forEach((polyline) => {
      // not run has no click event
        const audioDate = polyline.innerHTML;
        const [audioName] = audioDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || ["2021"]
        let audio = audios.filter(
          (r) => r.created_at.slice(0, 10) === audioName
        ).sort((a, b) => b.distance - a.distance)[0]
        
        // do not add the event next time
        // maybe a better way?
        if (audio) {
          polyline.onclick = () => console.log(2);
        }
      }
    )
  }, [year]);

  return (
    <>
      <Helmet bodyAttributes={{ class: styles.body }} />
      <Layout>
        <div className="mb5">
          <div className="w-100">
            <h1 className="f1 fw9 i">Gcores Audio</h1>
          </div>
          {viewport.zoom <= 3 ? <LocationStat audios={audios} location="a" onClick={changeYear} /> : <YearsStat audios={activities} year={year} onClick={changeYear} />}
          <div className="fl w-100 w-70-l">
            {audios.length === 1 ? (
              <RunMapWithViewport
                audios={audios}
                year={year}
                title={title}
                viewport={viewport}
                setViewport={setViewport}
                changeYear={changeYear}
              />
            ) : (
              <AudiosMap 
                audios={audios}
                year={year}
                changeYear={changeYear}
              />
            )}
            {year == 'Total' ? <SVGStat />
              : (
                <AudioTable
                  audios={audios}
                  year={year}
                  locateActivity={locateActivity}
                />
              )}
          </div>
        </div>
      </Layout>
    </>
  );
};


// Child components
const SVGStat = () => {
  return (
    <div>
      <GitHubSvg className={styles.audioSVG} />
      <GridSvg className={styles.audioSVG} />
    </div>
  )
};

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
          机核{yearsArr.length}年了，{yearsArr.length}年不容易祝机核越来越好，下面是
          {year}
          的电台数据
          <br />
        </p>
      </section>
      <hr color="blue" />
      {yearsArrayUpdate.map((year) => (
        <YearStat key={year} audios={audios} year={year} onClick={onClick} />
      ))}
      <YearStat key="Total" audios={audios} year="Total" onClick={onClick} />
    </div>
  );
};

const LocationStat = ({ audios, location, onClick }) => (
  <div className="fl w-100 w-30-l pb5 pr5-l">
    <section className="pb4" style={{ paddingBottom: '0rem' }}>
      <p>
        机核核聚变走过了几个城市，希望有一天能把地图点亮。
        <br />
      </p>
    </section>
    <hr color="red" />
    <LocationSummary key="locationsSummary" />
    <CitiesStat />
    <YearStat key="Total" audios={audios} year="Total" onClick={onClick} />
  </div>
);

const YearStat = ({ audios, year, onClick }) => {
  if (yearsArr.includes(year)) {
    audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  }
  let sumLikes = 0;
  let sumBookmarks = 0;
  let sumComments = 0;
  let sumDuration = 0;
  let djsSet = new Set();
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
      const djs = eval(audio.djs);
      djs.forEach((d) => {
        djsSet.add(d);
      })
    }
    if (audio.duration) {
      sumDuration += audio.duration || 0;
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
      <hr color="blue" />
    </div>
  );
};

const LocationSummary = () => (
  <div style={{ cursor: 'pointer' }}>
    <section>
      <Stat value={`${yearsArr.length}`} description=" 机核走过了" />
    </section>
    <hr color="red" />
  </div>
);

const CitiesStat = () => {
  return (
    <div style={{ cursor: 'pointer' }}>
      <section>
      </section>
      <hr color="red" />
    </div>
  );
};

const RunMap = ({
  audios, year, title, viewport, setViewport, changeYear,
}) => {
  year = year || '2020';
  let geoData = geoJsonForaudios(audios, year);

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

  return (
    <ReactMapGL
      {...viewport}
      mapStyle="mapbox://styles/mapbox/dark-v9"
      onViewportChange={setViewport}
      onLoad={addControlHandler}
      mapboxApiAccessToken={MAPBOX_TOKEN}
    >
      <RunMapButtons changeYear={changeYear} />
      <Source id="data" type="geojson" data={geoData}>

        <Layer
          id="audios2"
          type="line"
          paint={{
            'line-color': 'rgb(224,237,94)',
            'line-width':  2,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />
        <Layer
          id="prvince"
          type="fill"
          paint={{
            'fill-color': '#47b8e0',
          }}
          filter={""}
        />
      </Source>
      <span className={styles.runTitle}>{title}</span>
    </ReactMapGL>
  );
};

const AudiosMap = ({changeYear}) => {
  return (
  <div>
    <RunMapButtons changeYear={changeYear}/>
    <h1>dasdsadsa</h1>
  </div>
  )
}

const RunMapWithViewport = (props) => (
    <RunMap {...props} />
);

const RunMapButtons = ({ changeYear }) => {
  const yearsButtons = yearsArr.slice();
  yearsButtons.push("Total")
  const [index, setIndex] = useState(0);
  const handleClick = (e, year) => {
    const elementIndex = yearsButtons.indexOf(year);
    e.target.style.color = 'rgb(244, 67, 54)';

    const elements = document.getElementsByClassName(styles.button);
    elements[index].style.color = 'blue';
    setIndex(elementIndex);
  };
  return (
    <div>
      <ul className={styles.buttons}>
        {yearsButtons.map((year) => (
          <li
            key={`${year}button`}
            style={{ color: year === '2020' ? 'rgb(244, 67, 54)' : 'blue' }}
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

const AudioTable = ({ audios, year, locateActivity }) => {
  const [audioIndex, setaudioIndex] = useState(-1);
  if (!yearsArr.includes(year)) {
    // When total show 2020
    year = '2020';
  }
  audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  audios.sort((a, b) => new Date(b.created_at.replace(' ', 'T')) - new Date(a.created_at.replace(' ', 'T')));

  return (
    <div className={styles.tableContainer}>
      <table className={styles.audioTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            <th>Likes</th>
            <th>Comments</th>
            <th>Bookmarks</th>
            <th>Date</th>
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
              setaudioIndex={setaudioIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AudioRow = ({
  audios, audio, locateActivity, audioIndex, setaudioIndex,
}) => {
  // change click color
  const handleClick = (e, audios, audio) => {
    const elementIndex = audios.indexOf(audio);
    e.target.parentElement.style.color = 'red';

    const elements = document.getElementsByClassName(styles.audioRow);
    if (audioIndex !== -1) {
      elements[audioIndex].style.color = 'rgb(224,237,94)';
    }
    setaudioIndex(elementIndex);
  };

  return (
    <tr
      className={styles.audioRow}
      key={audio.created_at}
      onClick={(e) => {
        handleClick(e, audios, audio);
        locateActivity(audio);
      }}
    >
      <td>{audio.title}</td>
      <td>{audio.likes_count}</td>
      <td>{audio.comments_count}</td>
      <td>{audio.bookmarks_count}</td>
      <td className={styles.runDate}>{audio.created_at.slice(0, 11)}</td>
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

// Utilities
const intComma = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const geoJsonForaudios = (audios, year) => {
  if (audios.length > 1 && yearsArr.includes(year)) {
    audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  }
  return {
    type: 'FeatureCollection',
    features: audios.map((audio) => {
      const points = [];
      if (!points) {
        return null;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points,
        },
      };
    }),
  };
};

const geoJsonForMap = () => chinaGeojson;

const titleForShow = (audio) => {
  return audio.title
};

// for scroll to the map
const scrollToMap = () => {
  const el = document.querySelector('.fl.w-100.w-70-l');
  const rect = el.getBoundingClientRect();
  window.scroll(rect.left + window.scrollX, rect.top + window.scrollY);
};
