import PropTypes from "prop-types";
import ButtonComponent from "../Button";
import "@fontsource/roboto/300.css";
import { Link } from "react-router-dom";

const PostListItem = ({ post, onDeletePosts }) => {

  return (

    <div>
        <li key={post.index}>
          {/* {`${group.groupName} has ${group.friends.length} friends `} */}
            {`${post.title}`}
            <Link to={`/PostForm`} className="NavLink">
            <ButtonComponent text={"Edit"} onClicker={()=>{console.log(post)}}/>
            </Link>
          <ButtonComponent
            color={"red"}
            text={"Delete"}
            onClicker={onDeletePosts}
          />
        </li>

    </div>
  );
};

PostListItem.propTypes = {};

export default PostListItem;
