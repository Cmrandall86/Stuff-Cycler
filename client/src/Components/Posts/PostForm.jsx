import React from "react";
import PropTypes from "prop-types";
import { useState } from "react";
import Input from "../Input";
import "../../CSS/PostForm.css";
import ButtonComponent from "../Button";
import Card from "../Card";
import PostGroups from "./PostGroups";
import { useNavigate } from "react-router-dom";

const PostForm = ({ onSubmitPosts, list }) => {
  const [post, setPost] = useState({ title: "", description: ""});
  const [selectedGroups, setSelectedGroups] = useState(new Array(list.length).fill(false))


  const handleSelectGroup = (position) => {
    const updatedCheckedState = selectedGroups.map((item, index) =>
      index === position ? !item : item
    );

    setSelectedGroups(updatedCheckedState);}

  const navigate = useNavigate()

  const handleSetPost = (e, i) => {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setPost({
      ...post,
      [nameKey]: nameValue,
    });
  };

  // 

  const selectedGroupData = selectedGroups.map((isSelected, index) => {
    if( isSelected === true) {
      return list[index].id
    }
    return false
  } ).filter(data => data !== false)

  console.log(selectedGroupData)

  function handleSubmitPost(e) {
    e.preventDefault();
    onSubmitPosts({...post, groups: selectedGroupData});
    navigate('/PostsList')


  }


  return (
    <Card
      element={
        <div className="postFormWrapper">
          <h2 className="form_start_title">Share Your Stuff!</h2>
          <div className="PostForm">
            <form onSubmit={handleSubmitPost}>
              <Input
                className={"input"}
                Name={"id"}
                Placeholder={"Item ID"}
                Type={"text"}
                Value={post.id}
                rows={1}
                Label={"Item ID: "}
                onChange={(e, i) => {
                  handleSetPost(e, i);
                }}
              />
              <Input
                className={"input"}
                Name={"title"}
                Placeholder={"Item Name"}
                Type={"text"}
                Value={post.title}
                Label={"Item Name: "}
                onChange={(e, i) => {
                  handleSetPost(e, i);
                }}
              />
              <Input
                className={"input"}
                Name={"description"}
                Placeholder={"Item Description"}
                Type={"text"}
                Value={post.description}
                rows={4}
                Label={"Item Description: "}
                onChange={(e, i) => {
                  handleSetPost(e, i);
                }}
              />

              <PostGroups list={list} handleSelectGroup={handleSelectGroup} selectedGroups= {selectedGroups} />
              <ButtonComponent
                className={"post_button"}
                text="Share Item"
                onClicker={handleSubmitPost}
                disabled={false}
              />
            </form>
          </div>
        </div>
      }
    />
  );
};

PostForm.propTypes = {};

export default PostForm;
