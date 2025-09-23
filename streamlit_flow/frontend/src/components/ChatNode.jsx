import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const handlePosMap = {
    'top': Position.Top,
    'right': Position.Right,
    'bottom': Position.Bottom,
    'left': Position.Left,
};

const getHandleStyle = (pos) => {
    const offset = 0; // consistent offset for all sizes
    switch (pos) {
        case Position.Right:
            return { right: -offset, top: '50%', transform: 'translate(50%, -50%)' };
        case Position.Left:
            return { left: -offset, top: '50%', transform: 'translate(-50%, -50%)' };
        case Position.Top:
            return { top: -offset, left: '50%', transform: 'translate(-50%, -50%)' };
        case Position.Bottom:
            return { bottom: -offset, left: '50%', transform: 'translate(-50%, 50%)' };
        default:
            return {};
    }
}

const MemoizedChatInput = memo(({ content, onTextChange, placeholder = "Enter your prompt here..." }) => (
    <textarea
        value={content || ""}
        onChange={(e) => onTextChange?.(e.target.value)}
        className="chat-input"
        placeholder={placeholder}
    />
));

const ChatInputNode = ({ data, sourcePosition }) => {
    const position = handlePosMap[sourcePosition] || Position.Right;
    
    return (
        <>
            <Handle type="source" position={position} isConnectable style={getHandleStyle(position)} />
            <div className="chat-form">
                <MemoizedChatInput 
                    content={data.content}
                    onTextChange={data.onTextChange}
                    placeholder={data.placeholder}
                />
                <button className="chat-submit" onClick={() => data.onSubmit?.()}>
                    Submit
                </button>
                {data.submittedContent && (
                    <div className="chat-output">
                        {data.submittedContent}
                    </div>
                )}
            </div>
        </>
    );
};

const ChatOutputNode = ({ data, targetPosition }) => {
    const position = handlePosMap[targetPosition] || Position.Left;
    
    return (
        <>
            <Handle type="target" position={position} isConnectable style={getHandleStyle(position)} />
            <div className="chat-form">
                <MemoizedChatInput 
                    content={data.content}
                    onTextChange={data.onTextChange}
                    placeholder={data.placeholder}
                />
                <button className="chat-submit" onClick={() => data.onSubmit?.()}>
                    Submit
                </button>
                {data.submittedContent && (
                        <div className="chat-output">
                            {data.submittedContent}
                        </div>
                )}
            </div>
        </>
    );
};

const ChatDefaultNode = ({ data, sourcePosition, targetPosition }) => {
    const sourcePos = handlePosMap[sourcePosition] || Position.Right;
    const targetPos = handlePosMap[targetPosition] || Position.Left;
    
    return (
        <>
            <Handle type="source" position={sourcePos} isConnectable style={getHandleStyle(sourcePos)} />
            <div className="chat-form">
                <MemoizedChatInput 
                    content={data.content}
                    onTextChange={data.onTextChange}
                    placeholder={data.placeholder}
                />
                <button className="chat-submit" onClick={() => data.onSubmit?.()}>
                    Submit
                </button>
                {data.submittedContent && (
                    <div className="chat-output">
                        {data.submittedContent}
                    </div>
                )}
            </div>
            <Handle type="target" position={targetPos} isConnectable style={getHandleStyle(targetPos)} />
        </>
    );
};

export { ChatInputNode, ChatOutputNode, ChatDefaultNode }