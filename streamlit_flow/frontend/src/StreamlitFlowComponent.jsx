import React, { useRef, useEffect, useState, useMemo } from "react"
import {
    Streamlit,
} from "streamlit-component-lib"

import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useNodesInitialized,
    useReactFlow,
} from 'reactflow';

import 'reactflow/dist/style.css';
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import './style.css';

import {MarkdownInputNode, MarkdownOutputNode, MarkdownDefaultNode} from "./components/MarkdownNode";
import {ChatInputNode, ChatOutputNode, ChatDefaultNode} from "./components/ChatNode";
import PaneConextMenu from "./components/PaneContextMenu";
import NodeContextMenu from "./components/NodeContextMenu";
import EdgeContextMenu from "./components/EdgeContextMenu";

import createElkGraphLayout from "./layouts/ElkLayout";

const StreamlitFlowComponent = (props) => {

    const nodeTypes = useMemo(() => ({
        input: MarkdownInputNode,
        output: MarkdownOutputNode,
        default: MarkdownDefaultNode,
        chatInput: ChatInputNode,
        chatOutput: ChatOutputNode,     
        chatDefault: ChatDefaultNode
    }), []);
    
    const [viewFitAfterLayout, setViewFitAfterLayout] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(props.args.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(props.args.edges);
    const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(props.args.timestamp);
    const [layoutNeedsUpdate, setLayoutNeedsUpdate] = useState(false);

    const [layoutCalculated, setLayoutCalculated] = useState(false);

    const [paneContextMenu, setPaneContextMenu] = useState(null);
    const [nodeContextMenu, setNodeContextMenu] = useState(null);
    const [edgeContextMenu, setEdgeContextMenu] = useState(null);

    const nodesInitialized = useNodesInitialized({'includeHiddenNodes': false});

    const ref = useRef(null);
    const reactFlowInstance = useReactFlow();
    const {fitView, getNodes, getEdges} = useReactFlow();

    // Helper Functions
    const isChatNodeType = (type) => ['chatInput', 'chatOutput', 'chatDefault'].includes(type);

    const stripFunctionsFromNodes = (list) => list.map(n => ({
        ...n,
        data: Object.fromEntries(Object.entries(n.data || {}).filter(([k, v]) => typeof v !== 'function'))
    }));

    const updateChatNodeContent = (nodeId, newContent) => {
        setNodes(prevNodes => {
            const updated = prevNodes.map(n => n.id === nodeId ? {...n, data: {...n.data, content: newContent}} : n);
            handleDataReturnToStreamlit(updated, edges, null);
            return updated;
        });
    };

    const submitChatNode = (nodeId) => {
        setNodes(prevNodes => {
            const updated = prevNodes.map(n => {
                if (n.id !== nodeId) return n;
                const submittedContent = (n.data && n.data.content) || '';
                return { ...n, data: { ...n.data, submittedContent } };
            });
            handleDataReturnToStreamlit(updated, edges, nodeId);
            return updated;
        });
    };
    const handleLayout = () => {
        createElkGraphLayout(getNodes(), getEdges(), props.args.layoutOptions)
            .then(({nodes, edges}) => {
                setNodes(nodes);
                setEdges(edges);
                setViewFitAfterLayout(false);
                handleDataReturnToStreamlit(nodes, edges, null);
                setLayoutCalculated(true);
            })
            .catch(err => console.log(err));
    }

    const handleDataReturnToStreamlit = (_nodes, _edges, selectedId) => {

        const timestamp = (new Date()).getTime();
        setLastUpdateTimestamp(timestamp);
        const nodesClean = stripFunctionsFromNodes(_nodes);
        Streamlit.setComponentValue({'nodes': nodesClean, 'edges': _edges, 'selectedId': selectedId, 'timestamp': timestamp});
    }

    const calculateMenuPosition = (event) => {
        const pane = ref.current.getBoundingClientRect();
        return {
            top: event.clientY < pane.height - 200 && event.clientY,
            left: event.clientX < pane.width - 200 && event.clientX,
            right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
            bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
        }
    }

    const clearMenus = () => {
        setPaneContextMenu(null);
        setNodeContextMenu(null);
        setEdgeContextMenu(null);
    }

    useEffect(() => Streamlit.setFrameHeight());

    // Layout calculation
    useEffect(() => {
        if(nodesInitialized && !layoutCalculated)
            handleLayout();
    }, [nodesInitialized, layoutCalculated]);



    // Update elements if streamlit sends new arguments - check by comparing timestamp recency
    useEffect(() => {
        if (lastUpdateTimestamp <= props.args.timestamp)
        {
            setLayoutNeedsUpdate(true);
            setNodes(props.args.nodes);
            setEdges(props.args.edges);
            setLastUpdateTimestamp((new Date()).getTime());
            handleDataReturnToStreamlit(props.args.nodes, props.args.edges, null);
        }

    }, [props.args.nodes, props.args.edges]);

    // Handle layout when streamlit sends new state
    useEffect(() => {
        if(layoutNeedsUpdate)
        {
            setLayoutNeedsUpdate(false);
            setLayoutCalculated(false);
        }
    }, [nodes, edges])

    // Auto zoom callback
    useEffect(() => {
        if(!viewFitAfterLayout && props.args.fitView)
        {
            fitView();
            setViewFitAfterLayout(true);
        }
    }, [viewFitAfterLayout, props.args.fitView]);

    // Theme callback
    useEffect(() => {
        setEdges(edges.map(edge => ({...edge, labelStyle:{'fill': props.theme.base === "dark" ? 'white' : 'black'}})))
    }, [props.theme.base])

    // Context Menu Callbacks

    const handlePaneContextMenu = (event) => {
        event.preventDefault();

        setNodeContextMenu(null);
        setEdgeContextMenu(null);

        setPaneContextMenu({
            ...calculateMenuPosition(event),
            clickPos: reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
            })
        });
    }

    const handleNodeContextMenu = (event, node) => {
        event.preventDefault();

        setPaneContextMenu(null);
        setEdgeContextMenu(null);

        setNodeContextMenu({
            node: node,
            ...calculateMenuPosition(event)
        })
    }

    const handleEdgeContextMenu = (event, edge) => {
        event.preventDefault();

        setPaneContextMenu(null);
        setNodeContextMenu(null);

        setEdgeContextMenu({
            edge: edge,
            ...calculateMenuPosition(event)
        })
    }

    // Flow interaction callbacks

    const handlePaneClick = (event) => {
        clearMenus();
        handleDataReturnToStreamlit(nodes, edges, null);
    }

    const handleNodeClick = (event, node) => {
        clearMenus();
        if (props.args.getNodeOnClick)
            handleDataReturnToStreamlit(nodes, edges, node.id);
    }

    const handleEdgeClick = (event, edge) => {
        clearMenus();
        if (props.args.getEdgeOnClick)
            handleDataReturnToStreamlit(nodes, edges, edge.id);
    }


    const handleConnect = (params) => {
        const newEdgeId = `st-flow-edge_${params.source}-${params.target}`; 
        const newEdges = addEdge({...params, animated:props.args["animateNewEdges"], labelShowBg:false, id: newEdgeId}, edges);
        setEdges(newEdges);
        handleDataReturnToStreamlit(nodes, newEdges, newEdgeId);
    }

    const handleNodeDragStop = (event, node) => {
        const updatedNodes = nodes.map(n => {
            if(n.id === node.id)
                return node;
            return n;
        });
        handleDataReturnToStreamlit(updatedNodes, edges, null);
    }

    const renderNodes = useMemo(() => {
        return nodes.map(n => {
            if (!isChatNodeType(n.type)) return n;
            // inject non-serializable callbacks only for render; do not persist in state
            return {
                ...n,
                connectable: true,
                data: {
                    ...n.data,
                    onTextChange: (text) => updateChatNodeContent(n.id, text),
                    onSubmit: () => submitChatNode(n.id)
                }
            };
        });
    }, [nodes]);

    return (
        <div style={{height: props.args.height}}>
            <ReactFlow
                nodeTypes={nodeTypes}
                ref={ref}
                nodes={renderNodes}
                onNodesChange={onNodesChange}
                onNodeDragStop={handleNodeDragStop}
                edges={edges}
                onEdgesChange={onEdgesChange}
                onConnect={props.args.allowNewEdges ? handleConnect : null}
                fitView={props.args.fitView}
                style={props.args.style}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onNodeDragStart={clearMenus}
                onPaneClick={handlePaneClick}
                onPaneContextMenu={props.args.enablePaneMenu ? handlePaneContextMenu : (event) => {}}
                onNodeContextMenu={props.args.enableNodeMenu ? handleNodeContextMenu : (event, node) => {}}
                onEdgeContextMenu={props.args.enableEdgeMenu ? handleEdgeContextMenu : (event, edge) => {}}
                panOnDrag={props.args.panOnDrag}
                zoomOnDoubleClick={props.args.allowZoom}
                zoomOnScroll={props.args.allowZoom}
                zoomOnPinch={props.args.allowZoom}
                minZoom={props.args.minZoom}
                proOptions={{hideAttribution: props.args.hideWatermark}}>
                    <Background/>
                    {paneContextMenu && <PaneConextMenu 
                                            paneContextMenu={paneContextMenu} 
                                            setPaneContextMenu={setPaneContextMenu}
                                            nodes={nodes} 
                                            edges={edges} 
                                            setNodes={setNodes} 
                                            handleDataReturnToStreamlit={handleDataReturnToStreamlit}
                                            setLayoutCalculated={setLayoutCalculated}
                                            theme={props.theme}
                                            />
                    }
                    {nodeContextMenu && <NodeContextMenu 
                                            nodeContextMenu={nodeContextMenu} 
                                            setNodeContextMenu={setNodeContextMenu}
                                            nodes={nodes}
                                            edges={edges}
                                            setNodes={setNodes}
                                            setEdges={setEdges}
                                            handleDataReturnToStreamlit={handleDataReturnToStreamlit}
                                            theme={props.theme} 
                                            />
                    }
                    {edgeContextMenu && <EdgeContextMenu 
                                            edgeContextMenu={edgeContextMenu} 
                                            setEdgeContextMenu={setEdgeContextMenu} 
                                            nodes={nodes}
                                            edges={edges}
                                            setEdges={setEdges}
                                            handleDataReturnToStreamlit={handleDataReturnToStreamlit} 
                                            theme={props.theme}/>}
                    {props.args["showControls"] && <Controls/>}
                    {props.args["showMiniMap"] && <MiniMap pannable zoomable/>}
                </ReactFlow>
        </div>
    );
}

const ContextualStreamlitFlowComponent = (props) => {
    return (
        <ReactFlowProvider>
            <StreamlitFlowComponent {...props}/>
        </ReactFlowProvider>
    );
}

export default ContextualStreamlitFlowComponent;
