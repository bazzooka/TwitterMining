require('../styles/InfinitList.scss');

import React from 'react';
import { throttle } from 'lodash';

import { ProfilItem } from './ProfilItem';

const THROTTLE_SCROLL = 100; // ms
const INFINITE_SCROLL_TRIGGER = 250; // pixels remaining bottom of the container to trigger

const ListItems = {
  ProfilItem
};

export const InfinitList = React.createClass({
  getInitialState(){
    return {
      nbResult: 0,
      hits: [],
      start: 0,
      size: 8
    }
  },

  componentWillMount(){
    this.loadMoreIfScrolledEnough = throttle(
      this.loadMoreIfScrolledEnough, THROTTLE_SCROLL
    );
  },

  loadMoreIfScrolledEnough(e) {
    const { scrollHeight, scrollTop, clientHeight } = this.refs.contents;


    if (scrollHeight - scrollTop - clientHeight > INFINITE_SCROLL_TRIGGER) return;
    if (this.props.isLoading) return;
    // if (!this.props.isMore) return;

    this.setState({
      start: this.state.start + this.state.size
    }, ()=> {
      this.props.fetchProfiles(this.state.start, this.state.size);
    });
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.list.items.response && nextProps.list.items.response.hits){
      this.setState({
        nbResult: nextProps.list.items.response.hits.total,
        hits: nextProps.list.items.response.hits.hits
      })
    }
  },

  render() {
    const elts = this.state.hits.map((elt, key) => (
      React.createElement(ListItems.ProfilItem, { key, profil: elt })
    ));
    return (
      <div
        ref="contents"
        className="infinit-list-container"
        onScroll={this.loadMoreIfScrolledEnough}
      >
        {elts}
      </div>
    );
  }
});
