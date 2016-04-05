require('../styles/InfinitList.scss');

import React from 'react';
import { throttle } from 'lodash';

import { ProfilItem } from './ProfilItem';
import { DocumentItem } from './DocumentItem';

const THROTTLE_SCROLL = 100; // ms
const INFINITE_SCROLL_TRIGGER = 250; // pixels remaining bottom of the container to trigger

const ListItems = {
  ProfilItem,
  DocumentItem
};

export const InfinitList = React.createClass({
  getInitialState(){
    return {
      nbResult: 0,
      hits: [],
      start: 0,
      size: this.props.size || 8
    }
  },

  componentWillMount(){
    this.loadMoreIfScrolledEnough = throttle(
      this.loadMoreIfScrolledEnough, THROTTLE_SCROLL
    );
    this.props.fetchMethod(this.state.start, this.state.size);
  },

  loadMoreIfScrolledEnough(e) {
    const { scrollHeight, scrollTop, clientHeight } = this.refs.contents;

    if (scrollHeight - scrollTop - clientHeight > INFINITE_SCROLL_TRIGGER) return;
    if (this.props.list.isLoading) return;
    // if (!this.props.isMore) return;

    this.setState({
      start: this.state.start + this.state.size
    }, ()=> {
      this.props.fetchMethod(this.state.start, this.state.size);
    });
  },

  componentWillReceiveProps(nextProps){
    if(nextProps.list.items.length){
      this.setState({
        nbResult: nextProps.list.total,
        hits: nextProps.list.items
      })
    }
  },

  render() {
    const elts = this.state.hits.map((elt, key) => (
      React.createElement(ListItems[this.props.elem], { key, item: elt })
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
