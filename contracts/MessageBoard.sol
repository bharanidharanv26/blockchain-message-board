
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MessageBoard {

    // Store information about each message
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }

    // Store all messages
    Message[] public messages;

    // Function to add a new message
    function postMessage(string memory _content) public {

        require(bytes(_content).length > 0, "Message cannot be empty");

        messages.push(
            Message(
                msg.sender,
                _content,
                block.timestamp
            )
        );
    }

    // Get total number of messages
    function getMessageCount() public view returns (uint256) {
        return messages.length;
    }

    // Get a message using its index
    function getMessage(uint256 index)
        public
        view
        returns (address, string memory, uint256)
    {
        require(index < messages.length, "Message does not exist");

        Message memory message = messages[index];

        return (
            message.sender,
            message.content,
            message.timestamp
        );
    }
}
