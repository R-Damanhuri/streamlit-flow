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
        # Chat input node (source handle only)
        StreamlitFlowNode(
            id="chat_in_1",
            pos=(0, 0),
            data={"content": ""},
            node_type="chatInput",
            source_position="right",
        ),
        # Chat default node (source + target)
        StreamlitFlowNode(
            id="chat_mid_1",
            pos=(1, 0),
            data={"content": ""},
            node_type="chatDefault",
            source_position="right",
            target_position="left",
        ),
        # Chat output node (target handle only)
        StreamlitFlowNode(
            id="chat_out_1",
            pos=(2, 0),
            data={"content": ""},
            node_type="chatOutput",
            target_position="left",
        ),
    ]

    edges = [
        StreamlitFlowEdge("chat_in_1-chat_mid_1", "chat_in_1", "chat_mid_1", animated=True),
        StreamlitFlowEdge("chat_mid_1-chat_out_1", "chat_mid_1", "chat_out_1", animated=True),
    ]

    return StreamlitFlowState(nodes=nodes, edges=edges)


if "chat_state" not in st.session_state:
    st.session_state.chat_state = create_initial_state()


col_add, col_edge, col_reset = st.columns(3)

with col_add:
    if st.button("Tambah Chat Node"):
        new_id = f"chat_node_{uuid4()}"
        st.session_state.chat_state.nodes.append(
            StreamlitFlowNode(
                id=new_id,
                pos=(0, 0),
                data={"content": "Node baru"},
                node_type="chatDefault",
                source_position="right",
                target_position="left",
            )
        )
        st.rerun()

with col_edge:
    if st.button("Tambah Edge Acak"):
        nodes = st.session_state.chat_state.nodes
        if len(nodes) > 1:
            # pilih source bertipe chatInput/chatDefault, target bertipe chatDefault/chatOutput
            source_candidates = [n for n in nodes if n.type in ["chatInput", "chatDefault", "input", "default"]]
            target_candidates = [n for n in nodes if n.type in ["chatDefault", "chatOutput", "default", "output"]]
            if source_candidates and target_candidates:
                import random
                s = random.choice(source_candidates)
                t = random.choice(target_candidates)
                if s.id != t.id:
                    edge_id = f"{s.id}-{t.id}"
                    if not any(e.id == edge_id for e in st.session_state.chat_state.edges):
                        st.session_state.chat_state.edges.append(
                            StreamlitFlowEdge(edge_id, s.id, t.id, animated=True)
                        )
                        st.rerun()

with col_reset:
    if st.button("Reset"):
        st.session_state.chat_state = create_initial_state()
        st.rerun()


st.subheader("Canvas")

st.session_state.chat_state = streamlit_flow(
    key="chat_example",
    state=st.session_state.chat_state,
    height=520,
    layout=TreeLayout(direction="right"),
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


col_nodes, col_edges, col_selected = st.columns(3)

with col_nodes:
    st.caption("Nodes")
    for n in st.session_state.chat_state.nodes:
        st.write(n)

with col_edges:
    st.caption("Edges")
    for e in st.session_state.chat_state.edges:
        st.write(e)

with col_selected:
    st.caption("Selected ID")
    st.write(st.session_state.chat_state.selected_id)


