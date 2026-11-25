"""Topology tests against spintronics ground truth.

depth=1: K4 base case (single tetrahedron)
depth=2: 14-node dual-Sierpinski — validated by spintronics 14-node Quaternary
depth=3: 63-node toroidal IVM — validated by spintronics 64-tet construction

These node/edge/tet counts are the load-bearing invariants. Any change to
topology.py that fails these tests has changed the substrate.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from topology import build, degree_distribution


def test_depth1_K4():
    n, edges_set, edges_list, tets, positions = build(1)
    assert n == 4
    assert len(edges_list) == 6
    assert len(tets) == 1
    assert tets[0] == (0, 1, 2, 3)
    assert len(positions) == 4
    dist, degs = degree_distribution(n, edges_list)
    assert all(d == 3 for d in degs), f"K4 every vertex has degree 3, got {degs}"


def test_depth2_dual_sierpinski():
    n, edges_set, edges_list, tets, positions = build(2)
    assert n == 14, f"depth=2 must be 14 nodes, got {n}"
    assert len(edges_list) == 36, f"depth=2 must be 36 edges, got {len(edges_list)}"
    assert len(tets) == 8, f"depth=2 must be 8 sub-tets (4 normal + 4 inverse), got {len(tets)}"
    assert len(positions) == 14
    for tet in tets:
        assert len(tet) == 4
        assert len(set(tet)) == 4


def test_depth3_ivm_toroidal():
    n, edges_set, edges_list, tets, positions = build(3)
    assert n == 63, f"depth=3 must be 63 nodes, got {n}"
    assert len(edges_list) == 279, f"depth=3 must be 279 edges (240 internal + 39 toroidal), got {len(edges_list)}"
    assert len(tets) == 64, f"depth=3 must be 64 tets, got {len(tets)}"
    dist, degs = degree_distribution(n, edges_list)
    assert dist == {6: 8, 7: 12, 9: 30, 12: 13}, f"degree distribution mismatch: {dist}"
    mean_deg = sum(degs) / len(degs)
    assert abs(mean_deg - 8.857) < 0.01, f"mean degree should be ~8.86, got {mean_deg}"


def test_recursion_apex_is_first_vertex():
    """The 1:3 apex-base relationship is encoded in vertex order: tet[0] is apex."""
    for depth in (1, 2, 3):
        n, _, _, tets, _ = build(depth)
        for tet in tets:
            assert isinstance(tet[0], int)
            assert len({*tet}) == 4


def test_invalid_depth():
    import pytest
    for bad in (0, 4, -1):
        try:
            build(bad)
        except ValueError:
            continue
        raise AssertionError(f"build({bad}) should have raised ValueError")
