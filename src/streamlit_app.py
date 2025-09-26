import streamlit as st
from uuid import uuid4

from streamlit_flow import streamlit_flow
from streamlit_flow.elements import StreamlitFlowNode, StreamlitFlowEdge
from streamlit_flow.state import StreamlitFlowState
from streamlit_flow.layouts import TreeLayout

st.set_page_config("Streamlit Flow - Chat Nodes Example", layout="wide")
st.title("Streamlit Flow - Chat Nodes Example")

def create_initial_state() -> StreamlitFlowState:
    nodes = [
        StreamlitFlowNode(
            id="start_node",
            pos=(1, 0),
            data={"content": ""},
            node_type="chatInput",
            source_position="right",
            target_position="left",
        )
    ]

    edges = []
    return StreamlitFlowState(nodes=nodes, edges=edges)

if "chat_state" not in st.session_state:
    st.session_state.chat_state = create_initial_state()

st.subheader("Canvas")

st.session_state.chat_state = streamlit_flow(
    key="chat_example",
    state=st.session_state.chat_state,
    height=520,
    layout=TreeLayout(direction="down"),
    fit_view=True,
    show_minimap=True,
    show_controls=True,
    enable_node_menu=True,
    enable_edge_menu=True,
    enable_pane_menu=True,
    allow_new_edges=True,
    animate_new_edges=True,
    get_node_on_click=True,
    get_edge_on_click=True,
    min_zoom=0.1,
)

# cek apakah ada node submit
selected_id = st.session_state.chat_state.selected_id
if selected_id:
    for i, node in enumerate(st.session_state.chat_state.nodes):
        if node.id == selected_id:
            submitted = node.data.get("submittedContent")
            if submitted:
                llm_output = f"OUTPUT: {submitted}"
                
                new_data = dict(node.data)
                new_data.pop("submittedContent", None)
                new_data["output"] = llm_output

                st.session_state.chat_state.nodes[i].data = new_data
                st.rerun()

col1, col2, col3, col_selected = st.columns(4)

cols = [col1, col2, col3]

for i, n in enumerate(st.session_state.chat_state.nodes):
    with cols[i % 3]:
        st.caption(f"Node {n.id}")
        st.write("Content", n.data.get("content"))
        st.write("Submitted Content", n.data.get("submittedContent"))
        st.write("LLM Output", n.data.get("output"))
        st.write("")

with col_selected:
    st.caption("Selected ID")
    st.write(st.session_state.chat_state.selected_id)