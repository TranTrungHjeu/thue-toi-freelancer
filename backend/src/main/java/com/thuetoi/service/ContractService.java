package com.thuetoi.service;

import com.thuetoi.entity.Contract;
import com.thuetoi.entity.Milestone;
import com.thuetoi.repository.ContractRepository;
import com.thuetoi.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContractService {
    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    public Contract createContract(Contract contract) {
        return contractRepository.save(contract);
    }

    public List<Contract> getContractsByUser(Long userId) {
        return contractRepository.findAll(); // TODO: filter by user
    }

    public Milestone addMilestone(Milestone milestone) {
        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getMilestonesByContract(Long contractId) {
        return milestoneRepository.findAll(); // TODO: filter by contract
    }

    public Contract updateContractStatus(Long contractId, String status) {
        Contract contract = contractRepository.findById(contractId).orElse(null);
        if (contract != null) {
            contract.setStatus(status);
            return contractRepository.save(contract);
        }
        return null;
    }
}
