import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import FontIcon from 'material-ui/FontIcon'
import ReactTooltip from 'react-tooltip'
import TagsInput from 'react-tagsinput'
import Autosuggest from 'react-autosuggest'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import ActionLabel from 'material-ui/svg-icons/action/label'
import ActionDone from 'material-ui/svg-icons/action/done'
import ActionDelete from 'material-ui/svg-icons/action/delete'
import difference from 'lodash/difference'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { allTagsSelector } from '../selectors'
import { archiveItem, deleteItem, setTags, removeTag } from '../actions/PocketActions'

@connect(
  state => ({
    allTags: allTagsSelector(state),
  }),
  dispatch => bindActionCreators({
    archiveItem: archiveItem,
    deleteItem: deleteItem,
    setTags: setTags,
    removeTag: removeTag
  }, dispatch),
)

// if there is are no more items, Pocket will return something like this as a response:
// {"status":2,"complete":1,"list":[],"error":null,"search_meta":{"search_type":"normal"},"since":1484251363}

export default class PocketListItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tags: ( props.item.item.tags ?
        Object.keys(props.item.item.tags).map(tagKey => {
          return props.item.item.tags[tagKey].tag
        }) : []),
      open: false,
    }

    this.handleChange = this.handleChange.bind(this)
    this.deleteTag = this.deleteTag.bind(this)
    this.changeTags = this.changeTags.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props !== nextProps) {
      this.setState({
        tags: Object.keys(nextProps.item.item.tags).map(tagKey => {
          return nextProps.item.item.tags[tagKey].tag
        }),
      })
    }
  }

  archiveItem = () => {
    this.props.archiveItem(this.props.item.id)
  }

  deleteItem = () => {
    this.props.deleteItem(this.props.item.id)
  }

  urlParser = url => {
    let parser = document.createElement('a');
    parser.href = url;
    return parser.hostname;
  }

  handleChange(tags) {
    this.setState({tags})
  }

  changeTags() {
    this.props.setTags(this.props.item.id, this.state.tags.join('%2C'))
  }

  deleteTag(key) {
    this.props.removeTag(this.props.item.id, this.state.tags[key])
  }

  render(){
    const item = this.props.item.item;

    const imgExc = item.image ?
      (<div title={item.excerpt ? item.excerpt : ""} style={{
        backgroundImage: `url(${item.image.src})`,
        fontSize: '12px', color: 'darkgray', height: '150px',
        backgroundPosition: 'center center', backgroundSize: 'cover'}}>
      </div>) :
      (item.excerpt ?
        (<div style={{fontSize: "12px", margin: "5px 9px 0px 9px", color: "darkgray"}}>
          {item.excerpt}
        </div>) :
        (<span />)
      );

    const tags = Object.keys(this.props.allTags).map(key => this.props.allTags[key].name).sort();

    const defaultRenderTag = props => {
      let {tag, key, disabled, onRemove, classNameRemove, getTagDisplayValue, ...other} = props;
      return (
        <span key={key} {...other}>
          <span style={{
            whiteSpace: 'nowrap', maxWidth: '130px', overflow: 'hidden',
            textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'top'
          }}>
            {getTagDisplayValue(tag)}
          </span>
          {!disabled &&
            <a
              className={classNameRemove}
              onClick={
                (e) => {
                  onRemove(key);
                  this.deleteTag(key)
                }
              }
            />
          }
        </span>
      )
    }

    function autocompleteRenderInput({addTag, ...props}) {

      const handleOnChange = (e, {newValue, method}) => {
        if (method === 'enter') {
          e.preventDefault()
        } else {
          props.onChange(e)
        }
      }

      const inputValue = (props.value && props.value.trim().toLowerCase()) || ''
      const inputLength = inputValue.length

      let suggestions = tags.filter((tag) => {
        return tag.toLowerCase().slice(0, inputLength) === inputValue
      })

      return (
        <Autosuggest
          ref={props.ref}
          suggestions={suggestions}
          alwaysRenderSuggestions
          getSuggestionValue={(suggestion) => suggestion}
          renderSuggestion={(suggestion) => <span>{suggestion}</span>}
          inputProps={{...props, onChange: handleOnChange}}
          onSuggestionSelected={(e, {suggestion}) => {
            addTag(suggestion)
          }}
          onSuggestionsClearRequested={() => {}}
          onSuggestionsFetchRequested={() => {}}
        />
      )
    }

    const handleCloseMenu = (open, reason) => {
      if (open) {
        this.setState({open: true})
      } else {
        this.setState({open: false})
        let stateTags = this.state.tags;
        let propTags = item.tags ? Object.keys(item.tags).map(key => item.tags[key].tag) : [];
        let theDifference = difference(stateTags, propTags)
        if (theDifference.length) {
          this.changeTags();
        }
      }
    }

    const defaultRenderLayout = (tagComponents, inputComponent) => {
      const archive = this.archiveItem;
      const deleteFunc = this.deleteItem;
      return (
        <div>
          {tagComponents}
          <div className='item-toolbar' style={{padding: '0 15px'}}>
            <IconMenu
              onRequestChange={(open, reason) => handleCloseMenu(open, reason)}
              open={this.state.open}
              iconButtonElement={
                <IconButton>
                  <ActionLabel
                    data-tip={this.state.tags.length ? 'change tags' : 'add tags'}
                    className='item-toolbar-button' />
                </IconButton>
              }
              autoWidth={false}
              menuStyle={{width: '200px'}}>
              {inputComponent}
            </IconMenu>
            <IconButton onTouchTap={archive}>
              <ActionDone data-tip='archive' className='item-toolbar-button' />
            </IconButton>
            <IconButton onTouchTap={deleteFunc}>
              <ActionDelete data-tip='delete' className='item-toolbar-button' />
            </IconButton>
          </div>
        </div>
      )
    }

    return (
      <div style={{margin: "8px"}} className="paper">
        <Paper style={{width: "240px", padding: "12px 0"}}>
          <a href={"https://getpocket.com/a/read/".concat(item.item_id)}
             target="_blank" className="pocket-link item-link">
            <div style={{margin: "0 15px"}}>
              <div style={{display: "inline-block"}}>
                <img src="icons/pocket.png"
                  style={{verticalAlign: 'text-top'}} />
                <span className="item-title pocket-title highlight">
                  {item.resolved_title ? item.resolved_title : item.given_title}
                </span>
              </div>
            </div>
            <div style={{overflow: "hidden",
              textOverflow: "ellipsis", marginTop: '5px'}}>
              {imgExc}
            </div>
          </a>
          <div style={{margin: "4px 15px 0"}}>
            <a href={item.given_url} style={{textDecoration: "none"}}
              target="_blank">
              <div style={{display: "inline-block"}}>
                <img src={"http://www.google.com/s2/favicons?domain=".concat(item.given_url)}
                  style={{verticalAlign: 'text-bottom'}} />
                <span className="item-url" style={{marginLeft: '5px'}}>
                  {this.urlParser(item.given_url)}
                </span>
              </div>
            </a>
          </div>
          <TagsInput
            onlyUnique
            renderInput={autocompleteRenderInput}
            value={this.state.tags}
            onChange={this.handleChange}
            renderLayout={defaultRenderLayout}
            renderTag={defaultRenderTag}
          />
          {/*<div style={{margin: '9px 12px 4px 30px'}}>
            item.tags
              ? (<div className="tags">
                  {Object.keys(item.tags).map((tagKey, idx) => {
                    return (
                      <div key={idx} style={{cursor: "pointer"}} className="tag">
                        {item.tags[tagKey].tag}
                      </div>)
                    })}
                  </div>)
              : <span style={{display: "none"}} />
          </div>*/}
          {/* <div className='item-toolbar'>
            <FontIcon className='material-icons item-toolbar-button'
              onClick={this.deleteItem} data-tip='delete'>
              delete
            </FontIcon>
            <FontIcon className='material-icons item-toolbar-button'
              onClick={this.archiveItem} data-tip='archive'>
              done
            </FontIcon>
            <ReactTooltip place="bottom" type="dark" effect="solid" />
          </div> */}
        </Paper>
      </div>
    )
  }
}
