import React from "react";
import PropTypes from "prop-types";
import { useState } from "react";
import Input from "../Input";
import "../../CSS/PostForm.css";
import ButtonComponent from "../Button";

const PostForm = ({ onSubmitPosts }) => {
  const [post, setPost] = useState({ title: "", description: "" });

  const handleSubmitTitle = (e, i) => {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setPost({
      ...post,
      [nameKey]: nameValue,
    });
  };

  function handleSubmitPost(e) {
    e.preventDefault();
    onSubmitPosts(post);
  }

  return (
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
              handleSubmitTitle(e, i);
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
              handleSubmitTitle(e, i);
            }}
          />
          <ButtonComponent
            className={"post_button"}
            text="Share Item"
            onClicker={handleSubmitPost}
            disabled={false}
          />
        </form>
      </div>
    </div>
  );
};

PostForm.propTypes = {};

export default PostForm;
