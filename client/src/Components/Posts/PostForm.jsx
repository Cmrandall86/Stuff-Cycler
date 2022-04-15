import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Input from "../Input";
import "../../CSS/PostForm.css";
import ButtonComponent from "../Button";
import Card from "../Card";
import PostGroups from "./PostGroups";
import { useNavigate } from "react-router-dom";

const PostForm = () => {
  const [post, setPost] = useState({ title: "", description: "" });
  const [groupsList, setGroupsList] = useState([]);

  const [selectedGroups, setSelectedGroups] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/groups")
      .then((response) => response.json())
      .then((data) =>{
        setGroupsList(data)
        setSelectedGroups(new Array(data.length).fill(false))
      })
      .catch((error) => console.log(error));
  }, []);

  // console.log(groupsList)

  const selectedGroupData = selectedGroups
  .map((isSelected, index) => {
    if (isSelected === true) {
      return groupsList[index].id;
    }
    return false;
  })
  .filter((data) => data !== false);

  const handleSelectGroup = (position) => {
    const updatedCheckedState = selectedGroups.map((item, index) =>
      index === position ? !item : item
    );

    setSelectedGroups(updatedCheckedState);
  };

  const handleSetPost = (e, i) => {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setPost({
      ...post,
      [nameKey]: nameValue,
    });
  };

  const onSubmitPosts = (post) => {
    fetch(`http://localhost:8000/posts`, {
      method: "POST",
      body: JSON.stringify(post),
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      console.log("this", post);
    });
  };

  function handleSubmitPost(e) {
    e.preventDefault();
    onSubmitPosts({ ...post, groups: selectedGroupData });
    // navigate("/PostsList");
  }

console.log(post)
  return (
    <Card
      element={
        <div className="postFormWrapper">
          <h2 className="form_start_title">Share Your Stuff!</h2>
          <div className="PostForm">
            <form onSubmit={handleSubmitPost}>
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

             {selectedGroups.length && <PostGroups
                groupsList={groupsList}
                handleSelectGroup={handleSelectGroup}
                selectedGroups={selectedGroups}
              />}
              

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
