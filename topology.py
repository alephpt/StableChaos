"""Tetrahedral lattice topology, parameterized by recursion depth.

Depth is the substrate's only scaling knob. Each depth is the next level of the
same tetrahedral construction:

    depth=1   single tetrahedron K4         4 nodes,   6 edges,   1 tet
    depth=2   dual-Sierpinski (normal+inv)  14 nodes,  36 edges,  8 tets
    depth=3   IVM toroidal (8 cube-corners) 63 nodes,  279 edges, 64 tets

The 1:3 vertex relationship (one apex against three-base) is the substrate's
computational primitive. It is encoded per-tet by the order of vertices in the
returned tets_list: every tet is (apex, base_a, base_b, base_c) where the apex
is the FCT port-A and the base is ports B/C/D.

Ported from the spintronics project's tetrahedron_grid module (depth=2 and
depth=3 are its validated builders). Depth=1 is the K4 base case from which
the recursion starts.
"""

from itertools import combinations
import numpy as np


def build(depth):
    if depth == 1:
        return _build_depth1()
    if depth == 2:
        return _build_depth2()
    if depth == 3:
        return _build_depth3(toroidal=True)
    raise ValueError(f"depth={depth} not yet supported; depth in {{1,2,3}} validated against spintronics")


def _build_depth1():
    corners = [
        np.array([1.0, 1.0, 1.0]),
        np.array([1.0, -1.0, -1.0]),
        np.array([-1.0, 1.0, -1.0]),
        np.array([-1.0, -1.0, 1.0]),
    ]
    positions = {i: tuple(c) for i, c in enumerate(corners)}
    edges_set = {(min(a, b), max(a, b)) for a, b in combinations(range(4), 2)}
    edges_list = sorted(edges_set)
    tets_list = [(0, 1, 2, 3)]
    return 4, edges_set, edges_list, tets_list, positions


def _build_depth2():
    corners = [
        np.array([1.0, 1.0, 1.0]),
        np.array([1.0, -1.0, -1.0]),
        np.array([-1.0, 1.0, -1.0]),
        np.array([-1.0, -1.0, 1.0]),
    ]
    center = sum(corners) / 4.0

    edge_pairs = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
    mids = {(i, j): (corners[i] + corners[j]) / 2.0 for (i, j) in edge_pairs}
    inv_corners = [2.0 * center - c for c in corners]

    all_pos = list(corners) + [mids[e] for e in edge_pairs] + list(inv_corners)

    coord_to_id = {}
    positions = {}
    idx = 0
    for pos in all_pos:
        key = tuple(np.round(pos, 8))
        if key not in coord_to_id:
            coord_to_id[key] = idx
            positions[idx] = tuple(pos)
            idx += 1

    def get_id(pos):
        return coord_to_id[tuple(np.round(pos, 8))]

    corner_adj = {
        0: [(0, 1), (0, 2), (0, 3)],
        1: [(0, 1), (1, 2), (1, 3)],
        2: [(0, 2), (1, 2), (2, 3)],
        3: [(0, 3), (1, 3), (2, 3)],
    }

    tets_list = []
    edges_set = set()

    for i in range(4):
        verts = [get_id(corners[i])] + [get_id(mids[e]) for e in corner_adj[i]]
        tets_list.append(tuple(verts))
        for a, b in combinations(verts, 2):
            edges_set.add((min(a, b), max(a, b)))

    for i in range(4):
        verts = [get_id(inv_corners[i])] + [get_id(mids[e]) for e in corner_adj[i]]
        tets_list.append(tuple(verts))
        for a, b in combinations(verts, 2):
            edges_set.add((min(a, b), max(a, b)))

    n_nodes = len(positions)
    edges_list = sorted(edges_set)
    return n_nodes, edges_set, edges_list, tets_list, positions


def _build_depth3(toroidal=True):
    vertices = []
    vertex_map = {}

    def get_vertex(x, y, z):
        key = (x, y, z)
        if key in vertex_map:
            return vertex_map[key]
        i = len(vertices)
        vertices.append(key)
        vertex_map[key] = i
        return i

    edges_set = set()
    tets_list = []

    for cx in (-1, 1):
        for cy in (-1, 1):
            for cz in (-1, 1):
                for dx in (-1, 1):
                    for dy in (-1, 1):
                        for dz in (-1, 1):
                            v0 = get_vertex(cx + dx, cy + dy, cz + dz)
                            v1 = get_vertex(cx + dx, cy, cz)
                            v2 = get_vertex(cx, cy + dy, cz)
                            v3 = get_vertex(cx, cy, cz + dz)

                            for a, b in ((v0, v1), (v0, v2), (v0, v3),
                                         (v1, v2), (v1, v3), (v2, v3)):
                                edges_set.add((min(a, b), max(a, b)))

                            tets_list.append((v0, v1, v2, v3))

    n_nodes = len(vertices)
    positions = {i: vertices[i] for i in range(n_nodes)}

    if toroidal:
        pos_to_idx = {v: k for k, v in positions.items()}
        for i in range(n_nodes):
            x, y, z = positions[i]
            if x == -2:
                mirror = (2, y, z)
                if mirror in pos_to_idx:
                    j = pos_to_idx[mirror]
                    edges_set.add((min(i, j), max(i, j)))
            if y == -2:
                mirror = (x, 2, z)
                if mirror in pos_to_idx:
                    j = pos_to_idx[mirror]
                    edges_set.add((min(i, j), max(i, j)))
            if z == -2:
                mirror = (x, y, 2)
                if mirror in pos_to_idx:
                    j = pos_to_idx[mirror]
                    edges_set.add((min(i, j), max(i, j)))

    edges_list = sorted(edges_set)
    return n_nodes, edges_set, edges_list, tets_list, positions


def degree_distribution(n_nodes, edges_list):
    degs = [0] * n_nodes
    for i, j in edges_list:
        degs[i] += 1
        degs[j] += 1
    dist = {}
    for d in degs:
        dist[d] = dist.get(d, 0) + 1
    return dist, degs
